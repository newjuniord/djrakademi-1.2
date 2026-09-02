import { ID } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';

export type PaymentEventType =
	| 'initiation'
	| 'webhook_received'
	| 'cron_verification'
	| 'confirmation_success'
	| 'confirmation_failed';

export interface PaymentEventInput {
	orderId?: string;
	paymentId?: string;
	eventType: PaymentEventType;
	statusCode: number;
	requestPayload?: Record<string, unknown>;
	responsePayload?: Record<string, unknown>;
	errorMessage?: string;
}

const SENSITIVE_KEY = /authorization|cookie|api[-_]?key|secret|password|token|client[-_]?id/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
	if (depth > 8) return '[depth-limit]';
	if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value;
	if (typeof value === 'string') return value.length > 4000 ? `${value.slice(0, 4000)}…[truncated]` : value;
	if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeValue(item, depth + 1));
	if (typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).slice(0, 200).map(([key, item]) => [
				key,
				SENSITIVE_KEY.test(key) ? '[redacted]' : sanitizeValue(item, depth + 1)
			])
		);
	}
	return String(value);
}

function sanitizePayload(payload?: Record<string, unknown>): Record<string, unknown> | undefined {
	return payload ? sanitizeValue(payload) as Record<string, unknown> : undefined;
}

function stringifyPayload(payload?: Record<string, unknown>): string | undefined {
	if (!payload) return undefined;
	const serialized = JSON.stringify(payload);
	if (serialized.length <= 24_000) return serialized;
	return JSON.stringify({ truncated: true, originalLength: serialized.length, preview: serialized.slice(0, 23_000) });
}

export async function recordPaymentEvent(event: PaymentEventInput): Promise<void> {
	try {
		const { tables } = adminServices();
		const requestPayload = sanitizePayload(event.requestPayload);
		const responsePayload = sanitizePayload(event.responsePayload);
		await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: 'payment_logs',
			rowId: ID.unique(),
			data: {
				order_id: event.orderId || undefined,
				payment_id: event.paymentId || undefined,
				event_type: event.eventType,
				status_code: Math.max(100, Math.min(599, event.statusCode)),
				request_payload: stringifyPayload(requestPayload),
				response_payload: stringifyPayload(responsePayload),
				error_message: event.errorMessage || undefined,
				created_at: new Date().toISOString()
			}
		});
	} catch (error) {
		console.warn('[Payment Logs] Journalisation impossible:', error instanceof Error ? error.message : error);
	}
}
