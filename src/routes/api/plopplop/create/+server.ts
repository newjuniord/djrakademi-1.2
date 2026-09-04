import { json, type RequestHandler } from '@sveltejs/kit';
import {
	initiatePlopplopPaymentServer,
	requirePaymentUser,
	PaymentServerError,
	type PaymentMethod,
	type PaymentProviderTrace
} from '$lib/server/payments';
import { recordPaymentEvent } from '$lib/server/payment-logs';
import { isPurchaseMaintenanceEnabled, MAINTENANCE_MESSAGE } from '$lib/server/maintenance';

export const POST: RequestHandler = async ({ request, url }) => {
	const startedAt = Date.now();
	let safeRequest: Record<string, unknown> = {};
	let providerTrace: PaymentProviderTrace | undefined;
	try {
		const user = await requirePaymentUser(request);
		if (await isPurchaseMaintenanceEnabled()) {
			throw new PaymentServerError(MAINTENANCE_MESSAGE, 503);
		}
		const body = await request.json().catch(() => ({}));
		const productType = body?.productType;
		const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';
		const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : undefined;
		const paymentMethod = (body?.paymentMethod || 'moncash') as PaymentMethod;
		safeRequest = { productType, productId, bookingId, paymentMethod };

		if (!productId || !['course', 'ebook', 'coaching'].includes(productType)) {
			return json({ success: false, message: 'Type de produit ou ID invalide.' }, { status: 400 });
		}

		if (!['moncash', 'natcash'].includes(paymentMethod)) {
			return json({ success: false, message: 'Méthode de paiement Plopplop invalide (MonCash ou Natcash requis).' }, { status: 400 });
		}

		const result = await initiatePlopplopPaymentServer(
			{ productType, productId, bookingId, paymentMethod, originUrl: url.origin },
			user,
			(trace) => { providerTrace = trace; }
		);

		await recordPaymentEvent({
			orderId: result.orderId,
			paymentId: result.paymentId,
			eventType: 'initiation',
			statusCode: 200,
			requestPayload: providerTrace?.request || safeRequest,
			responsePayload: { status: result.status, message: result.message, durationMs: Date.now() - startedAt }
		});

		return json(result);
	} catch (error) {
		console.error('[API Plopplop Create Error]:', error instanceof Error ? error.message : error);
		const status = error instanceof PaymentServerError ? error.status : 500;
		const message = error instanceof Error ? error.message : 'Erreur serveur lors de la création du paiement Plopplop.';
		return json({ success: false, message }, { status });
	}
};
