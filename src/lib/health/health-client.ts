import { account } from '$lib/appwrite';
import type { ApiLogEntry, ApiMethod } from '$lib/types/admin';

export type AdminHealthStatus = 'operational' | 'degraded' | 'down';

export interface AdminHealthSnapshot {
	status: AdminHealthStatus;
	statusCode: number | null;
	statusText: string;
	checkedAt: string | null;
	logs: ApiLogEntry[];
}

const methods = new Set<ApiMethod>(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

function asRecord(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function parseLog(value: unknown): ApiLogEntry | null {
	const log = asRecord(value);
	if (!log || typeof log.id !== 'string' || typeof log.method !== 'string' || !methods.has(log.method as ApiMethod)) return null;
	if (typeof log.endpoint !== 'string' || typeof log.statusCode !== 'number') return null;
	if (typeof log.responseTimeMs !== 'number' || typeof log.timestamp !== 'string') return null;
	return {
		id: log.id,
		method: log.method as ApiMethod,
		endpoint: log.endpoint,
		statusCode: log.statusCode,
		statusText: typeof log.statusText === 'string' ? log.statusText : '',
		responseTimeMs: log.responseTimeMs,
		clientIp: typeof log.clientIp === 'string' ? log.clientIp : '',
		userAgent: typeof log.userAgent === 'string' ? log.userAgent : '',
		timestamp: log.timestamp,
		requestHeaders: (asRecord(log.requestHeaders) as Record<string, string> | null) ?? {},
		requestPayload: asRecord(log.requestPayload) ?? undefined,
		responsePayload: asRecord(log.responsePayload) ?? undefined
	};
}

export function isAdminHealthBackendConfigured(): boolean {
	return true;
}

export async function fetchAdminHealth(signal?: AbortSignal): Promise<AdminHealthSnapshot> {
	let jwt: string;
	try { jwt = (await account.createJWT()).jwt; }
	catch { throw new Error('Votre session admin a expiré. Reconnectez-vous.'); }

	const response = await fetch('/api/admin/health', {
		method: 'GET',
		headers: { Accept: 'application/json', Authorization: `Bearer ${jwt}` },
		credentials: 'same-origin',
		cache: 'no-store',
		signal
	});
	const payload = await response.json().catch(() => null);
	if (!response.ok) throw new Error(payload?.message || 'Impossible de charger la supervision Plopplop.');
	if (!payload || !['operational', 'degraded', 'down'].includes(String(payload.status))) {
		throw new Error('La réponse de supervision Plopplop est invalide.');
	}
	return {
		status: payload.status,
		statusCode: typeof payload.statusCode === 'number' ? payload.statusCode : null,
		statusText: typeof payload.statusText === 'string' ? payload.statusText : '',
		checkedAt: typeof payload.checkedAt === 'string' ? payload.checkedAt : null,
		logs: Array.isArray(payload.logs)
			? payload.logs.map(parseLog).filter((log: ApiLogEntry | null): log is ApiLogEntry => log !== null)
			: []
	};
}

export async function purgeAdminHealthLogs(days: number): Promise<{ success: boolean; deletedCount: number }> {
	let jwt: string;
	try { jwt = (await account.createJWT()).jwt; }
	catch { throw new Error('Votre session admin a expiré. Reconnectez-vous.'); }

	const response = await fetch(`/api/admin/health?days=${days}`, {
		method: 'DELETE',
		headers: { Accept: 'application/json', Authorization: `Bearer ${jwt}` },
		credentials: 'same-origin',
		cache: 'no-store'
	});
	const payload = await response.json().catch(() => null);
	if (!response.ok) throw new Error(payload?.message || 'Impossible de nettoyer les logs.');
	return {
		success: payload?.success === true,
		deletedCount: typeof payload?.deletedCount === 'number' ? payload.deletedCount : 0
	};
}
