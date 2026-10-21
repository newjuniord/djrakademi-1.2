import { createHmac, timingSafeEqual } from 'node:crypto';

export interface PlopplopWebhookEvent {
	event: 'transaction.created' | 'transaction.status_changed';
	timestamp: string;
	transaction: {
		transaction_id: string;
		reference_id: string;
		amount: number;
		method?: string;
		old_status?: string;
		new_status?: 'ok' | 'no' | 'pending' | 'failed';
	};
	merchant: { client_id: string };
}

export function verifyPlopplopSignature(rawBody: string, header: string | null, secret: string): boolean {
	const match = /^sha256=([a-f0-9]{64})$/i.exec(header || '');
	if (!secret || !match) return false;
	const received = Buffer.from(match[1], 'hex');
	const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
	return received.length === expected.length && timingSafeEqual(received, expected);
}

export function parsePlopplopWebhook(rawBody: string, clientId: string): PlopplopWebhookEvent | null {
	let data: any;
	try { data = JSON.parse(rawBody); } catch { return null; }
	if (!data || !['transaction.created', 'transaction.status_changed'].includes(data.event)) return null;
	if (typeof data.timestamp !== 'string' || !Number.isFinite(Date.parse(data.timestamp))) return null;
	if (data.merchant?.client_id !== clientId || !clientId) return null;
	const tx = data.transaction;
	if (!tx || typeof tx.reference_id !== 'string' || !tx.reference_id.trim() ||
		typeof tx.transaction_id !== 'string' || !tx.transaction_id.trim() ||
		typeof tx.amount !== 'number' || !Number.isFinite(tx.amount) || tx.amount < 0) return null;
	if (data.event === 'transaction.status_changed' && !['ok', 'no', 'pending', 'failed'].includes(tx.new_status)) return null;
	return data as PlopplopWebhookEvent;
}

export function matchesPlopplopOrder(
	order: { payment_provider?: string; amount?: number; payment_id?: string },
	transaction: PlopplopWebhookEvent['transaction']
): boolean {
	return ['moncash', 'natcash', 'carte', 'card'].includes(order.payment_provider || '') &&
		Number(order.amount) === transaction.amount &&
		(!order.payment_id || String(order.payment_id) === transaction.transaction_id.trim());
}
