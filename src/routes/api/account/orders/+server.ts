import { json, type RequestHandler } from '@sveltejs/kit';
import { Query } from 'node-appwrite';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const user = await requirePaymentUser(request);
		const { tables } = adminServices();
		const result = await tables.listRows({
			databaseId: DATABASE_ID, tableId: 'orders',
			queries: [Query.equal('user_id', user.$id), Query.orderDesc('created_at'), Query.limit(100)]
		});
		return json({
			orders: result.rows.map((row: any) => ({
				id: row.$id, userId: row.user_id, customerName: row.customer_name || '', customerEmail: row.customer_email || '',
				customerPhone: row.customer_phone, productType: row.product_type, productId: row.product_id, productTitle: row.product_title || '',
				amount: Number(row.amount) || 0, currency: row.currency || 'HTG', paymentProvider: row.payment_provider || 'free',
				paymentId: row.payment_id, status: row.status || 'pending', createdAt: row.created_at || row.$createdAt, paidAt: row.paid_at
			}))
		});
	} catch (error) {
		const status = error instanceof PaymentServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Impossible de charger vos transactions.' }, { status });
	}
};
