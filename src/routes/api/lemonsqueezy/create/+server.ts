import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, initiateLemonSqueezyPaymentServer, PaymentServerError } from '$lib/server/payments';
import { isPurchaseMaintenanceEnabled, MAINTENANCE_MESSAGE } from '$lib/server/maintenance';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const user = await requirePaymentUser(request);
		if (await isPurchaseMaintenanceEnabled()) {
			throw new PaymentServerError(MAINTENANCE_MESSAGE, 503);
		}
		const body = await request.json().catch(() => ({}));

		const productType = body?.productType;
		const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';
		const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : undefined;
		const variantId = body?.variantId ? String(body.variantId).trim() : undefined;

		if (!productId || !['course', 'ebook', 'coaching'].includes(productType)) {
			return json({ success: false, message: 'Type de produit ou ID invalide.' }, { status: 400 });
		}

		const result = await initiateLemonSqueezyPaymentServer(
			{ productType, productId, bookingId, variantId, paymentMethod: 'carte', originUrl: url.origin },
			user
		);

		return json(result);
	} catch (error) {
		console.error('[API Lemon Squeezy Create Error]:', error instanceof Error ? error.message : error);
		const status = error instanceof PaymentServerError ? error.status : 500;
		const message = error instanceof Error ? error.message : 'Erreur serveur lors de la création du paiement Lemon Squeezy.';
		return json({ success: false, message }, { status });
	}
};
