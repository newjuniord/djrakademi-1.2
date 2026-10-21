import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { finalizePlopplopPaymentServer, PaymentServerError } from '$lib/server/payments';
import { recordPaymentEvent } from '$lib/server/payment-logs';
import { matchesPlopplopOrder, parsePlopplopWebhook, verifyPlopplopSignature } from '$lib/server/plopplop-webhook';

export const POST: RequestHandler = async ({ request }) => {
	const secret = env.PLOPPLOP_CLIENT_SECRET?.trim();
	const clientId = env.PLOPPLOP_CLIENT_ID?.trim();
	if (!secret || !clientId) return json({ success: false, message: 'Webhook non configuré.' }, { status: 503 });
	if (Number(request.headers.get('content-length') || 0) > 64_000) return json({ success: false }, { status: 413 });
	const rawBody = await request.text();
	if (rawBody.length > 64_000) return json({ success: false }, { status: 413 });
	if (!verifyPlopplopSignature(rawBody, request.headers.get('x-webhook-signature'), secret)) {
		return json({ success: false, message: 'Signature invalide.' }, { status: 401 });
	}
	const payload = parsePlopplopWebhook(rawBody, clientId);
	if (!payload) return json({ success: false, message: 'Payload invalide.' }, { status: 400 });
	const tx = payload.transaction;
	const orderId = tx.reference_id.trim();
	const paymentId = tx.transaction_id.trim();
	const logBase = {
		orderId, paymentId, eventType: 'webhook_received' as const,
		requestPayload: { event: payload.event, reference_id: orderId, transaction_id: paymentId, amount: tx.amount, old_status: tx.old_status, new_status: tx.new_status, timestamp: payload.timestamp }
	};
	try {
		const { tables } = adminServices();
		const order: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: 'orders', rowId: orderId });
		if (!matchesPlopplopOrder(order, tx)) {
			await recordPaymentEvent({ ...logBase, statusCode: 409, errorMessage: 'Commande, montant ou transaction non concordant.' });
			return json({ success: false, message: 'Transaction non concordante.' }, { status: 409 });
		}
		if (payload.event === 'transaction.created' || tx.new_status !== 'ok') {
			await recordPaymentEvent({ ...logBase, statusCode: 200, responsePayload: { processed: true, accessGranted: false } });
			return json({ success: true, accessGranted: false });
		}
		const result = await finalizePlopplopPaymentServer(orderId, paymentId, 'webhook');
		await recordPaymentEvent({ ...logBase, statusCode: 200, responsePayload: { processed: true, accessGranted: result.success, paymentConfirmedBy: result.order?.paymentConfirmedBy } });
		return json({ success: true, accessGranted: result.success });
	} catch (error: any) {
		const status = error instanceof PaymentServerError ? error.status : error?.code === 404 ? 404 : 500;
		await recordPaymentEvent({ ...logBase, statusCode: status, errorMessage: error instanceof Error ? error.message : 'Erreur interne.' });
		return json({ success: false, message: status === 404 ? 'Commande introuvable.' : 'Webhook non traité.' }, { status });
	}
};
