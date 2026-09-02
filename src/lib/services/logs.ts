import { tables, DATABASE_ID } from '$lib/appwrite';
import { ID, Query } from 'appwrite';

export const COLLECTION_PAYMENT_LOGS = 'payment_logs';

export interface PaymentLog {
	id: string;
	orderId?: string;
	paymentId?: string;
	eventType: 'initiation' | 'webhook_received' | 'cron_verification' | 'confirmation_success' | 'confirmation_failed';
	statusCode: number;
	requestPayload?: Record<string, any>;
	responsePayload?: Record<string, any>;
	errorMessage?: string;
	createdAt: string;
}

export function mapPaymentLogDoc(doc: any): PaymentLog {
	let reqPayload: Record<string, any> | undefined = undefined;
	let resPayload: Record<string, any> | undefined = undefined;
	try {
		if (doc.request_payload || doc.requestPayload) {
			reqPayload = JSON.parse(doc.request_payload || doc.requestPayload);
		}
	} catch (e) {}
	try {
		if (doc.response_payload || doc.responsePayload) {
			resPayload = JSON.parse(doc.response_payload || doc.responsePayload);
		}
	} catch (e) {}

	return {
		id: doc.$id,
		orderId: doc.order_id || doc.orderId || undefined,
		paymentId: doc.payment_id || doc.paymentId || undefined,
		eventType: doc.event_type || doc.eventType || 'initiation',
		statusCode: typeof doc.status_code === 'number' ? doc.status_code : doc.statusCode || 200,
		requestPayload: reqPayload,
		responsePayload: resPayload,
		errorMessage: doc.error_message || doc.errorMessage || undefined,
		createdAt: doc.created_at || doc.createdAt || doc.$createdAt || new Date().toISOString()
	};
}

/**
 * Enregistre un événement de log dans Appwrite
 */
export async function logPaymentEvent(data: Omit<PaymentLog, 'id' | 'createdAt'>): Promise<void> {
	try {
		const now = new Date().toISOString();
		await tables.createRow(DATABASE_ID, COLLECTION_PAYMENT_LOGS, ID.unique(), {
			order_id: data.orderId || '',
			orderId: data.orderId || '',
			payment_id: data.paymentId || '',
			paymentId: data.paymentId || '',
			event_type: data.eventType,
			eventType: data.eventType,
			status_code: data.statusCode,
			statusCode: data.statusCode,
			request_payload: data.requestPayload ? JSON.stringify(data.requestPayload) : '',
			requestPayload: data.requestPayload ? JSON.stringify(data.requestPayload) : '',
			response_payload: data.responsePayload ? JSON.stringify(data.responsePayload) : '',
			responsePayload: data.responsePayload ? JSON.stringify(data.responsePayload) : '',
			error_message: data.errorMessage || '',
			errorMessage: data.errorMessage || '',
			created_at: now,
			createdAt: now
		});
	} catch (e) {
		console.warn('[LogService] Failed to record payment log to Appwrite:', e);
	}
}

/**
 * Récupère les derniers logs pour la page d'administration /admin/health
 */
export async function getRecentPaymentLogs(limit = 100): Promise<PaymentLog[]> {
	try {
		const res: any = await tables.listRows(DATABASE_ID, COLLECTION_PAYMENT_LOGS, [
			Query.limit(limit)
		]);
		const list = res.rows || res.documents || [];
		return list.map((doc: any) => mapPaymentLogDoc(doc));
	} catch (e) {
		console.warn('[LogService] Failed to fetch payment logs:', e);
		return [];
	}
}
