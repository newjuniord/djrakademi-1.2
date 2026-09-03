import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, initiateLemonSqueezyPaymentServer, PaymentServerError } from '$lib/server/payments';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const user = await requirePaymentUser(request);
		const body = await request.json().catch(() => ({}));

		const productType = body?.productType;
		const productId = typeof body?.productId === 'string' ? body.productId.trim() : '';
		const variantId = body?.variantId ? String(body.variantId).trim() : undefined;

		if (!productId || !['course', 'ebook', 'coaching'].includes(productType)) {
			return json({ success: false, message: 'Type de produit ou ID invalide.' }, { status: 400 });
		}

		const result = await initiateLemonSqueezyPaymentServer(
			{ productType, productId, variantId, paymentMethod: 'carte', originUrl: url.origin },
			user
		);

		return json(result);
	} catch (error) {
		console.error('[API Lemon Squeezy Checkout Error]:', error instanceof Error ? error.message : error);
		const status = error instanceof PaymentServerError ? error.status : 500;
		const message = error instanceof Error ? error.message : 'Erreur serveur lors du checkout Lemon Squeezy.';
		return json({ success: false, message }, { status });
	}
};
