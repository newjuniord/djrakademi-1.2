import { json, type RequestHandler } from '@sveltejs/kit';
import {
	initiatePlopplopPaymentServer,
	requirePaymentUser,
	PaymentServerError,
	type PaymentMethod,
	type PaymentProviderTrace
} from '$lib/server/payments';
import { recordPaymentEvent } from '$lib/server/payment-logs';

function traceOrderId(trace?: PaymentProviderTrace): string | undefined {
	const body = trace?.request?.body;
	if (!body || typeof body !== 'object') return undefined;
	const value = (body as Record<string, unknown>).refference_id;
	return typeof value === 'string' ? value : undefined;
}

function tracePaymentId(trace?: PaymentProviderTrace): string | undefined {
	const body = trace?.response?.body;
	if (!body || typeof body !== 'object') return undefined;
	const value = (body as Record<string, unknown>).transaction_id;
	return value === undefined || value === null ? undefined : String(value);
}

function traceStatus(trace: PaymentProviderTrace | undefined, fallback: number): number {
	const value = Number(trace?.response?.statusCode);
	return Number.isFinite(value) ? value : fallback;
}

export const POST: RequestHandler = async ({ request }) => {
	const startedAt = Date.now();
	let safeRequest: Record<string, unknown> = {};
	let providerTrace: PaymentProviderTrace | undefined;
	try {
		const user = await requirePaymentUser(request);
		const body = await request.json();
		const productType = body?.productType;
		const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';
		const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : undefined;
		const paymentMethod = body?.paymentMethod as PaymentMethod;
		safeRequest = { productType, productId, bookingId, paymentMethod };
		if (!productId || !['course', 'ebook', 'coaching'].includes(productType)) {
			await recordPaymentEvent({
				eventType: 'initiation', statusCode: 400, requestPayload: safeRequest,
				responsePayload: { durationMs: Date.now() - startedAt }, errorMessage: 'Produit invalide.'
			});
			return json({ success: false, message: 'Produit invalide.' }, { status: 400 });
		}
		const result = await initiatePlopplopPaymentServer(
			{ productType, productId, bookingId, paymentMethod },
			user,
			(trace) => { providerTrace = trace; }
		);
		await recordPaymentEvent({
			orderId: result.orderId,
			paymentId: result.paymentId,
			eventType: 'initiation',
			statusCode: traceStatus(providerTrace, 200),
			requestPayload: providerTrace?.request || safeRequest,
			responsePayload: providerTrace
				? { ...providerTrace.response, application: { success: true, message: result.message } }
				: { status: result.status, message: result.message, durationMs: Date.now() - startedAt }
		});
		return json(result);
	} catch (error) {
		console.error('[API Payments Create]:', error instanceof Error ? error.message : error);
		const status = error instanceof PaymentServerError ? error.status : 500;
		const message = error instanceof PaymentServerError ? error.message : 'Erreur serveur lors de la création du paiement.';
		await recordPaymentEvent({
			orderId: traceOrderId(providerTrace),
			paymentId: tracePaymentId(providerTrace),
			eventType: 'initiation',
			statusCode: traceStatus(providerTrace, error instanceof PaymentServerError && error.providerStatus ? error.providerStatus : status),
			requestPayload: providerTrace?.request || safeRequest,
			responsePayload: providerTrace
				? { ...providerTrace.response, application: { success: false, message } }
				: { durationMs: Date.now() - startedAt },
			errorMessage: message
		});
		return json({ success: false, message }, { status });
	}
};
