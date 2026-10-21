import { json, type RequestHandler } from '@sveltejs/kit';
import { ID, Query } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { confirmPlopplopPaymentServer, PaymentServerError, requirePaymentUser } from '$lib/server/payments';

async function verifyReference(request: Request, reference: string) {
	const user = await requirePaymentUser(request);
	const ref = reference.trim();
	if (!ref) throw new PaymentServerError('La référence est requise.', 400);
	const { tables } = adminServices();
	let order: any;
	try {
		order = await tables.getRow({ databaseId: DATABASE_ID, tableId: 'orders', rowId: ref });
	} catch (error: any) {
		if (error?.code !== 404) throw error;
		const found = await tables.listRows({ databaseId: DATABASE_ID, tableId: 'orders', queries: [Query.equal('payment_id', ref), Query.limit(1)] });
		order = found.rows[0];
	}
	if (!order) throw new PaymentServerError('Commande introuvable pour cette référence.', 404);
	if (order.user_id !== user.$id) throw new PaymentServerError('Accès refusé à cette commande.', 403);
	const result = await confirmPlopplopPaymentServer(order.$id, user);
	return { result, userId: user.$id, order };
}

function errorResponse(error: unknown) {
	const status = error instanceof PaymentServerError ? error.status : 500;
	return json({ success: false, message: error instanceof Error ? error.message : 'Vérification impossible.', notFound: status === 404 }, { status });
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const reference = String(body?.reference || body?.reference_id || body?.refference_id || body?.ref || '').trim();
		const { result, userId, order } = await verifyReference(request, reference);
		await adminServices().tables.createRow({
			databaseId: DATABASE_ID, tableId: 'verification_logs', rowId: ID.unique(),
			data: {
				user_id: userId, input_value: reference, method: 'mobile',
				status: result.success ? 'success' : 'failed', message: result.message,
				granted_items: result.success && order.product_type === 'course' ? order.product_id : undefined,
				created_at: new Date().toISOString()
			}
		}).catch((error) => console.warn('[Payment Verify Log]:', error instanceof Error ? error.message : error));
		return json({ success: result.success, productType: order.product_type, courseId: order.product_type === 'course' ? order.product_id : undefined, message: result.message }, { status: result.success ? 200 : 202 });
	} catch (error) {
		return errorResponse(error);
	}
};

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		const reference = url.searchParams.get('reference') || url.searchParams.get('refference_id') || url.searchParams.get('ref') || '';
		const { result, order } = await verifyReference(request, reference);
		return json({ success: result.success, productType: order.product_type, courseId: order.product_type === 'course' ? order.product_id : undefined, message: result.message }, { status: result.success ? 200 : 202 });
	} catch (error) {
		return errorResponse(error);
	}
};
