import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { adminServices, DATABASE_ID, Query } from '$lib/server/admin-appwrite';
import {
	getSupportUserStatusServer,
	createSupportMessageServer,
	SUPPORT_PRESETS,
	SupportServerError
} from '$lib/server/support';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const user = await requirePaymentUser(request);
		const status = await getSupportUserStatusServer(user.$id);

		// Fetch user's orders (any status: pending, paid, failed, expired) to populate order selector in UI
		let userOrders: any[] = [];
		try {
			const { tables } = adminServices();
			const res = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: 'orders',
				queries: [Query.equal('user_id', user.$id), Query.orderDesc('created_at'), Query.limit(50)]
			});
			userOrders = res.rows.map((o: any) => ({
				id: o.$id,
				productType: o.product_type,
				productTitle: o.product_title,
				amount: o.amount,
				currency: o.currency || 'HTG',
				status: o.status,
				paymentProvider: o.payment_provider,
				createdAt: o.created_at || o.$createdAt
			}));
		} catch {
			userOrders = [];
		}

		return json({
			...status,
			presets: SUPPORT_PRESETS,
			orders: userOrders
		});
	} catch (error) {
		const status = error instanceof PaymentServerError ? error.status : 500;
		const message = error instanceof Error ? error.message : 'Erreur de chargement du statut de support.';
		return json({ success: false, message }, { status });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const user = await requirePaymentUser(request);
		const body = await request.json().catch(() => ({}));
		const presetId = typeof body?.presetId === 'string' ? body.presetId.trim() : '';
		const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : undefined;
		const whatsapp = typeof body?.whatsapp === 'string' ? body.whatsapp.trim() : undefined;

		const created = await createSupportMessageServer(user.$id, { presetId, orderId, whatsapp });
		return json({ success: true, message: created });
	} catch (error) {
		const status = error instanceof SupportServerError ? error.status : (error instanceof PaymentServerError ? error.status : 500);
		const message = error instanceof Error ? error.message : 'Impossible de créer le message de support.';
		return json({ success: false, message }, { status });
	}
};
