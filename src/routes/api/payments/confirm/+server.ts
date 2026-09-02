import { json, type RequestHandler } from '@sveltejs/kit';
import {
	confirmPlopplopPaymentServer,
	requirePaymentUser,
	PaymentServerError,
	type PaymentProviderTrace
} from '$lib/server/payments';
import { recordPaymentEvent } from '$lib/server/payment-logs';

function traceStatus(trace: PaymentProviderTrace | undefined, fallback: number): number {
	const value = Number(trace?.response?.statusCode);
	return Number.isFinite(value) ? value : fallback;
}

export const POST: RequestHandler = async ({ request }) => {
	const startedAt = Date.now();
	let orderId = '';
	let providerTrace: PaymentProviderTrace | undefined;
	try {
		const user = await requirePaymentUser(request);
		const body = await request.json();
		orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
		if (!orderId) {
			await recordPaymentEvent({
				eventType: 'confirmation_failed', statusCode: 400,
				requestPayload: { orderId }, errorMessage: 'orderId est requis.'
			});
			return json({ success: false, message: 'orderId est requis.' }, { status: 400 });
		}
		const result = await confirmPlopplopPaymentServer(
			orderId,
			user,
			(trace) => { providerTrace = trace; }
		);
		const applicationStatus = result.success ? 200 : 202;
		await recordPaymentEvent({
			orderId,
			paymentId: result.order?.paymentId,
			eventType: result.success ? 'confirmation_success' : 'confirmation_failed',
			statusCode: traceStatus(providerTrace, applicationStatus),
			requestPayload: providerTrace?.request || { method: 'POST', endpoint: '/api/payments/confirm', body: { orderId } },
			responsePayload: providerTrace
				? { ...providerTrace.response, application: { statusCode: applicationStatus, success: result.success, message: result.message } }
				: { success: result.success, message: result.message, durationMs: Date.now() - startedAt }
		});
		return json(result, { status: applicationStatus });
	} catch (error) {
		console.error('[API Payments Confirm]:', error instanceof Error ? error.message : error);
		const status = error instanceof PaymentServerError ? error.status : 500;
		const message = error instanceof PaymentServerError ? error.message : 'Erreur serveur lors de la vérification du paiement.';
		await recordPaymentEvent({
			orderId: orderId || undefined,
			eventType: 'confirmation_failed',
			statusCode: traceStatus(providerTrace, error instanceof PaymentServerError && error.providerStatus ? error.providerStatus : status),
			requestPayload: providerTrace?.request || (orderId ? { method: 'POST', endpoint: '/api/payments/confirm', body: { orderId } } : undefined),
			responsePayload: providerTrace
				? { ...providerTrace.response, application: { statusCode: status, success: false, message } }
				: { durationMs: Date.now() - startedAt },
			errorMessage: message
		});
		return json({ success: false, order: null, message }, { status });
	}
};
