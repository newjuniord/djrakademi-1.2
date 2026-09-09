import { tables, databases, Query, ID, DATABASE_ID } from '$lib/appwrite';
import type { CoachingService, CoachingSlot, CoachingSettings, CoachingUnavailability } from '$lib/types/coaching';

export const SERVICES_COLLECTION = 'coaching_services';
export const SETTINGS_COLLECTION = 'coaching_settings';
export const UNAVAILABILITY_COLLECTION = 'coaching_unavailability';

// Default coach settings fallback
export const DEFAULT_SETTINGS: CoachingSettings = {
	id: 'default',
	userId: 'admin',
	country: 'HT',
	timezone: 'America/Port-au-Prince',
	whatsapp: '+50937000000',
	workingDays: [1, 2, 3, 4, 5],
	workStart: '09:00',
	workEnd: '17:00',
	breakDuration: 0,
	noticeHours: 24,
	maxAdvanceDays: 90,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString()
};

// Map Appwrite document to CoachingService
export function mapServiceDoc(doc: any): CoachingService {
	const vId = doc.lemonsqueezy_variant_id || doc.variant_id || doc.variantId || '';
	const pUsd = typeof doc.price_usd === 'number' ? doc.price_usd : (typeof doc.priceUsd === 'number' ? doc.priceUsd : undefined);
	return {
		id: doc.$id,
		ownerId: doc.owner_id || 'admin',
		title: doc.title || '',
		slug: doc.slug || '',
		description: doc.description || '',
		price: typeof doc.price === 'number' ? doc.price : 0,
		priceUsd: pUsd && pUsd > 0 ? pUsd : undefined,
		currency: doc.currency || 'HTG',
		isFree: Boolean(doc.is_free),
		durationMinutes: doc.duration_minutes || 60,
		active: Boolean(doc.active),
		variantId: vId,
		lemonsqueezyVariantId: vId,
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString(),
		updatedAt: doc.updated_at || doc.$updatedAt || new Date().toISOString()
	};
}

// Map Appwrite document to CoachingSettings
export function mapSettingsDoc(doc: any): CoachingSettings {
	return {
		id: doc.$id,
		userId: doc.user_id || 'admin',
		country: doc.country || 'HT',
		timezone: doc.timezone || 'America/Port-au-Prince',
		whatsapp: doc.whatsapp || '+50937000000',
		workingDays: (() => { try { const value = JSON.parse(doc.working_days || '[1,2,3,4,5]'); return Array.isArray(value) ? value.map(Number) : [1, 2, 3, 4, 5]; } catch { return [1, 2, 3, 4, 5]; } })(),
		workStart: doc.work_start || '09:00',
		workEnd: doc.work_end || '17:00',
		breakDuration: typeof doc.break_duration === 'number' ? doc.break_duration : 0,
		noticeHours: typeof doc.notice_hours === 'number' ? doc.notice_hours : 24,
		maxAdvanceDays: typeof doc.max_advance_days === 'number' ? doc.max_advance_days : 90,
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString(),
		updatedAt: doc.updated_at || doc.$updatedAt || new Date().toISOString()
	};
}

/* ============================================================================
   1. COACHING SERVICES METHODS
   ============================================================================ */

export async function getCoachingServices(): Promise<CoachingService[]> {
	try {
		const res = await tables.listRows(DATABASE_ID, SERVICES_COLLECTION, [
			Query.orderDesc('$createdAt'),
			Query.limit(100)
		]);
		return res.rows.map((doc) => mapServiceDoc(doc));
	} catch (error) {
		console.warn('[Appwrite Coaching Service] Could not fetch services from Appwrite:', error);
		return [];
	}
}

export async function getActiveCoachingServices(): Promise<CoachingService[]> {
	try {
		const res = await tables.listRows(DATABASE_ID, SERVICES_COLLECTION, [
			Query.equal('active', true),
			Query.orderDesc('$createdAt'),
			Query.limit(100)
		]);
		return res.rows.map((doc) => mapServiceDoc(doc));
	} catch (error) {
		console.warn('[Appwrite Coaching Service] Could not fetch active services from Appwrite:', error);
		return [];
	}
}

export async function getCoachingServiceBySlug(slug: string): Promise<CoachingService | null> {
	try {
		const res = await tables.listRows(DATABASE_ID, SERVICES_COLLECTION, [
			Query.equal('slug', slug),
			Query.limit(1)
		]);
		if (res.rows.length > 0) {
			return mapServiceDoc(res.rows[0]);
		}
		return null;
	} catch (error) {
		console.warn(`[Appwrite Coaching Service] Could not fetch service by slug "${slug}":`, error);
		return null;
	}
}

export async function getCoachingServiceById(id: string): Promise<CoachingService | null> {
	try {
		const doc = await tables.getRow(DATABASE_ID, SERVICES_COLLECTION, id);
		return mapServiceDoc(doc);
	} catch (error) {
		console.warn(`[Appwrite Coaching Service] Could not fetch service by id "${id}":`, error);
		return null;
	}
}

async function runWithAttributeFallback(
	action: (payload: Record<string, any>) => Promise<any>,
	payload: Record<string, any>
): Promise<any> {
	let currentPayload = { ...payload };
	while (true) {
		try {
			return await action(currentPayload);
		} catch (e: any) {
			const msg = String(e?.message || '');
			const match = msg.match(/Unknown attribute:\s*"?([a-zA-Z0-9_]+)"?/);
			if (match && match[1] && match[1] in currentPayload) {
				delete currentPayload[match[1]];
				continue;
			}
			throw e;
		}
	}
}

export async function createCoachingService(data: {
	title: string;
	slug: string;
	description: string;
	price: number;
	priceUsd?: number;
	isFree: boolean;
	durationMinutes: number;
	active: boolean;
	variantId?: string;
	lemonsqueezyVariantId?: string;
}): Promise<CoachingService> {
	const now = new Date().toISOString();
	const vId = (data.variantId || data.lemonsqueezyVariantId || '').trim();
	const payload: Record<string, any> = {
		owner_id: 'admin',
		title: data.title,
		slug: data.slug,
		description: data.description,
		price: data.price,
		price_usd: typeof data.priceUsd === 'number' && data.priceUsd > 0 ? data.priceUsd : undefined,
		currency: 'HTG',
		is_free: data.isFree,
		duration_minutes: data.durationMinutes,
		active: data.active,
		lemonsqueezy_variant_id: vId,
		variant_id: vId,
		created_at: now,
		updated_at: now,
	};

	const doc = await runWithAttributeFallback(
		(p) => tables.createRow(DATABASE_ID, SERVICES_COLLECTION, ID.unique(), p),
		payload
	);

	return mapServiceDoc(doc);
}

export async function updateCoachingService(
	id: string,
	data: {
		title: string;
		slug: string;
		description: string;
		price: number;
		priceUsd?: number;
		isFree: boolean;
		durationMinutes: number;
		active: boolean;
		variantId?: string;
		lemonsqueezyVariantId?: string;
	}
): Promise<CoachingService> {
	const vId = (data.variantId || data.lemonsqueezyVariantId || '').trim();
	const payload: Record<string, any> = {
		title: data.title,
		slug: data.slug,
		description: data.description,
		price: data.price,
		price_usd: typeof data.priceUsd === 'number' && data.priceUsd > 0 ? data.priceUsd : 0,
		is_free: data.isFree,
		duration_minutes: data.durationMinutes,
		active: data.active,
		lemonsqueezy_variant_id: vId,
		variant_id: vId,
		updated_at: new Date().toISOString(),
	};

	const updatedDoc = await runWithAttributeFallback(
		(p) => tables.updateRow(DATABASE_ID, SERVICES_COLLECTION, id, p),
		payload
	);

	return mapServiceDoc(updatedDoc);
}

export async function deleteCoachingService(id: string): Promise<void> {
	await tables.deleteRow(DATABASE_ID, SERVICES_COLLECTION, id);
}

/* ============================================================================
   3. COACHING SETTINGS METHODS
   ============================================================================ */

export async function getCoachingSettings(): Promise<CoachingSettings> {
	try {
		const res = await tables.listRows(DATABASE_ID, SETTINGS_COLLECTION, [
			Query.limit(1)
		]);
		if (res.rows.length > 0) {
			return mapSettingsDoc(res.rows[0]);
		}
	} catch (error) {
		console.warn('[Appwrite Coaching Service] Could not fetch settings from Appwrite:', error);
	}
	return DEFAULT_SETTINGS;
}

export async function updateCoachingSettings(data: {
	country: string;
	timezone: string;
	whatsapp: string;
	workingDays?: number[];
	workStart?: string;
	workEnd?: string;
	breakDuration?: number;
	noticeHours?: number;
	maxAdvanceDays?: number;
}): Promise<CoachingSettings> {
	const now = new Date().toISOString();
	let existingDocId: string | null = null;

	try {
		const res = await tables.listRows(DATABASE_ID, SETTINGS_COLLECTION, [Query.limit(1)]);
		if (res.rows.length > 0) {
			existingDocId = res.rows[0].$id;
		}
	} catch (e) {
		console.warn('[Appwrite Coaching Service] Could not list settings docs:', e);
	}

	const payload: Record<string, any> = {
		user_id: 'admin',
		country: data.country,
		timezone: data.timezone,
		whatsapp: data.whatsapp,
		working_days: JSON.stringify(data.workingDays || [1, 2, 3, 4, 5]),
		work_start: data.workStart || '09:00',
		work_end: data.workEnd || '17:00',
		break_duration: Math.max(0, Number(data.breakDuration ?? 0)),
		notice_hours: Math.max(0, Number(data.noticeHours ?? 24)),
		max_advance_days: Math.max(1, Number(data.maxAdvanceDays ?? 90)),
		created_at: now,
		updated_at: now
	};

	let updatedDoc: any;

	if (existingDocId) {
		updatedDoc = await runWithAttributeFallback(
			(p) => tables.updateRow(DATABASE_ID, SETTINGS_COLLECTION, existingDocId!, p),
			payload
		).catch(() =>
			runWithAttributeFallback(
				(p) => databases.updateDocument(DATABASE_ID, SETTINGS_COLLECTION, existingDocId!, p),
				payload
			)
		);
	} else {
		updatedDoc = await runWithAttributeFallback(
			(p) => tables.createRow(DATABASE_ID, SETTINGS_COLLECTION, ID.unique(), p),
			payload
		).catch(() =>
			runWithAttributeFallback(
				(p) => databases.createDocument(DATABASE_ID, SETTINGS_COLLECTION, ID.unique(), p),
				payload
			)
		);
	}

	return mapSettingsDoc(updatedDoc);
}

export async function getDynamicCoachingSlots(serviceId: string): Promise<CoachingSlot[]> {
	const response = await fetch(`/api/coaching/${encodeURIComponent(serviceId)}/availability`);
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data?.message || 'Impossible de charger les disponibilités.');
	return Array.isArray(data.slots) ? data.slots : [];
}

export async function getCoachingUnavailability(serviceId: string): Promise<CoachingUnavailability[]> {
	const response = await tables.listRows(DATABASE_ID, UNAVAILABILITY_COLLECTION, [
		Query.equal('service_id', serviceId), Query.orderAsc('start_at'), Query.limit(100)
	]);
	return response.rows.map((row: any) => ({
		id: row.$id, serviceId: row.service_id || null, startAt: row.start_at, endAt: row.end_at, reason: row.reason || ''
	}));
}

export async function createCoachingUnavailability(
	serviceId: string, startAt: string, endAt: string, reason = ''
): Promise<CoachingUnavailability> {
	const payload: Record<string, any> = {
		service_id: serviceId, start_at: startAt, end_at: endAt, reason, created_at: new Date().toISOString()
	};
	const row: any = await runWithAttributeFallback(
		(p) => tables.createRow(DATABASE_ID, UNAVAILABILITY_COLLECTION, ID.unique(), p),
		payload
	);
	return { id: row.$id, serviceId: row.service_id || null, startAt: row.start_at, endAt: row.end_at, reason: row.reason || '' };
}

export async function deleteCoachingUnavailability(id: string): Promise<void> {
	await tables.deleteRow(DATABASE_ID, UNAVAILABILITY_COLLECTION, id);
}
