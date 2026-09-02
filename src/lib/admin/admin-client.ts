import { env } from '$env/dynamic/public';
import { account } from '$lib/appwrite';
import type { AdminUser, Order } from '$lib/types/admin';
import type { Booking, BookingStatus } from '$lib/types/coaching';

export interface PaginatedResult<T> {
	items: T[];
	total: number;
}

export interface AdminOrdersResult extends PaginatedResult<Order> {
	summary: { paid: number; pending: number; failed: number; expired: number };
}

export interface AdminOverview {
	revenue: number;
	paidOrders: number;
	totalUsers: number;
	disabledUsers: number;
	totalBookings: number;
	recentOrders: Order[];
	recentUsers: Array<Pick<AdminUser, 'id' | 'name' | 'email' | 'createdAt'>>;
	upcomingBookings: Array<{
		id: string;
		customerName: string;
		serviceTitle: string;
		startAt: string;
	}>;
}

export interface AdminProductOption {
	id: string;
	title: string;
	type: 'course' | 'ebook';
}

export interface AdminUserDetail extends AdminUser {
	whatsapp?: string;
}

export interface AdminSession {
	id: string;
	name: string;
	email: string;
}

export interface PlatformSettings {
	siteName: string;
	tagline: string;
	contactEmail: string;
	whatsappNumber: string;
	timezone: string;
	currency: 'HTG';
	maintenanceMode: boolean;
	logoUrl?: string;
}

export class AdminApiError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
		this.name = 'AdminApiError';
	}
}

let cachedJwt: { value: string; expiresAt: number } | null = null;

async function getAdminJwt() {
	if (cachedJwt && cachedJwt.expiresAt > Date.now()) return cachedJwt.value;
	const value = (await account.createJWT()).jwt;
	cachedJwt = { value, expiresAt: Date.now() + 10 * 60 * 1000 };
	return value;
}

function getBasePath(): string {
	const configured = env.PUBLIC_ADMIN_API_PATH?.trim() || '/api/admin';
	if (!configured.startsWith('/') || configured.startsWith('//')) {
		throw new AdminApiError('PUBLIC_ADMIN_API_PATH doit être un chemin local commençant par /.');
	}
	return configured.replace(/\/$/, '');
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
	let jwt: string;
	try {
		jwt = await getAdminJwt();
	} catch {
		throw new AdminApiError('Votre session a expiré. Reconnectez-vous.', 401);
	}
	const response = await fetch(`${getBasePath()}${path}`, {
		...init,
		credentials: 'same-origin',
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${jwt}`,
			...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
			...init.headers
		}
	});

	const body = await response.json().catch(() => null);
	if (!response.ok) {
		if (response.status === 401 || response.status === 403) cachedJwt = null;
		const message = body?.message || body?.error || `Erreur API (${response.status}).`;
		throw new AdminApiError(message, response.status);
	}
	return body as T;
}

function queryString(params: Record<string, string | number | undefined>): string {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') query.set(key, String(value));
	}
	const serialized = query.toString();
	return serialized ? `?${serialized}` : '';
}

export function getAdminOverview(): Promise<AdminOverview> {
	return adminRequest('/overview');
}

export function getAdminCourses(): Promise<import('$lib/types/admin').Course[]> {
	return adminRequest('/courses');
}

export function clearAdminSessionCache(): void {
	cachedJwt = null;
}

export function getAdminSession(): Promise<AdminSession> {
	return adminRequest('/session');
}

export function getAdminUsers(params: {
	page: number;
	limit: number;
	search?: string;
	status?: 'active' | 'disabled';
}): Promise<PaginatedResult<AdminUser>> {
	return adminRequest(`/users${queryString(params)}`);
}

export function setAdminUserStatus(userId: string, status: 'active' | 'disabled'): Promise<AdminUser> {
	return adminRequest(`/users/${encodeURIComponent(userId)}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status })
	});
}

export function getAdminUser(userId: string): Promise<AdminUserDetail> {
	return adminRequest(`/users/${encodeURIComponent(userId)}`);
}

export function getAdminProducts(): Promise<AdminProductOption[]> {
	return adminRequest('/products');
}

export function createAdminAccessGrant(data: {
	userId: string;
	itemType: 'course' | 'ebook';
	itemId: string;
}): Promise<{ created: boolean }> {
	return adminRequest('/access-grants', { method: 'POST', body: JSON.stringify(data) });
}

export function getAdminOrders(params: {
	page: number;
	limit: number;
	search?: string;
	status?: 'pending' | 'paid' | 'failed' | 'expired';
	type?: 'course' | 'ebook' | 'coaching';
}): Promise<AdminOrdersResult> {
	return adminRequest(`/orders${queryString(params)}`);
}

export function getAdminBookings(): Promise<Booking[]> {
	return adminRequest('/bookings');
}

export function setAdminBookingStatus(
	bookingId: string,
	status: Extract<BookingStatus, 'completed' | 'cancelled'>
): Promise<Booking> {
	return adminRequest(`/bookings/${encodeURIComponent(bookingId)}`, {
		method: 'PATCH',
		body: JSON.stringify({ status })
	});
}

export function getPlatformSettings(): Promise<PlatformSettings> {
	return adminRequest('/settings');
}

export function updatePlatformSettings(settings: PlatformSettings, logo?: File | null): Promise<PlatformSettings> {
	const form = new FormData();
	form.set('settings', JSON.stringify(settings));
	if (logo) form.set('logo', logo);
	return adminRequest('/settings', { method: 'PUT', body: form });
}

const IMPERSONATION_STORAGE_KEY = 'djrakademi_admin_impersonation';

export interface ImpersonationMarker {
	adminUserId: string;
	adminSecret: string;
	targetName: string;
	expiresAt: string;
}

export function getImpersonationMarker(): ImpersonationMarker | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const parsed = JSON.parse(sessionStorage.getItem(IMPERSONATION_STORAGE_KEY) || 'null');
		if (!parsed?.adminUserId || !parsed?.adminSecret || Date.parse(parsed.expiresAt) <= Date.now()) {
			sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
			return null;
		}
		return parsed;
	} catch {
		sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
		return null;
	}
}

export async function startAdminImpersonation(userId: string): Promise<void> {
	const result = await adminRequest<{
		target: { userId: string; secret: string; name: string; expire: string };
		adminReturn: { userId: string; secret: string; expire: string };
	}>(`/users/${encodeURIComponent(userId)}/impersonate`, { method: 'POST' });
	const marker: ImpersonationMarker = {
		adminUserId: result.adminReturn.userId,
		adminSecret: result.adminReturn.secret,
		targetName: result.target.name,
		expiresAt: result.adminReturn.expire
	};
	sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(marker));
	try {
		await account.deleteSession('current');
		await account.createSession({ userId: result.target.userId, secret: result.target.secret });
		window.location.assign('/dashboard');
	} catch (error) {
		sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
		try { await account.createSession({ userId: marker.adminUserId, secret: marker.adminSecret }); } catch { /* Admin can reconnect normally. */ }
		throw error;
	}
}

export async function returnToAdminSession(): Promise<void> {
	const marker = getImpersonationMarker();
	if (!marker) throw new AdminApiError('La session de retour administrateur a expiré.', 401);
	try { await account.deleteSession('current'); } catch { /* The impersonated session may already be closed. */ }
	await account.createSession({ userId: marker.adminUserId, secret: marker.adminSecret });
	sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
	clearAdminSessionCache();
	window.location.assign('/admin/users');
}
