import { tables, databases, Query, ID, DATABASE_ID } from '$lib/appwrite';
import type { CoachingService, CoachingSlot, CoachingSettings, SlotStatus } from '$lib/types/coaching';

export const SERVICES_COLLECTION = 'coaching_services';
export const SLOTS_COLLECTION = 'coaching_slots';
export const SETTINGS_COLLECTION = 'coaching_settings';

// Default coach settings fallback
export const DEFAULT_SETTINGS: CoachingSettings = {
	id: 'default',
	userId: 'admin',
	country: 'HT',
	timezone: 'America/Port-au-Prince',
	whatsapp: '+50937000000',
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString()
};

// Map Appwrite document to CoachingService
export function mapServiceDoc(doc: any): CoachingService {
	return {
		id: doc.$id,
		ownerId: doc.owner_id || 'admin',
		title: doc.title || '',
		slug: doc.slug || '',
		description: doc.description || '',
		price: typeof doc.price === 'number' ? doc.price : 0,
		currency: doc.currency || 'HTG',
		isFree: Boolean(doc.is_free),
		durationMinutes: doc.duration_minutes || 60,
		active: Boolean(doc.active),
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString(),
		updatedAt: doc.updated_at || doc.$updatedAt || new Date().toISOString()
	};
}

// Map Appwrite document to CoachingSlot
export function mapSlotDoc(doc: any): CoachingSlot {
	return {
		id: doc.$id,
		serviceId: doc.service_id || '',
		startAt: doc.start_at || '',
		endAt: doc.end_at || '',
		coachTimezone: doc.coach_timezone || 'America/Port-au-Prince',
		status: (doc.status as SlotStatus) || 'available',
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString()
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

export async function createCoachingService(data: {
	title: string;
	slug: string;
	description: string;
	price: number;
	isFree: boolean;
	durationMinutes: number;
	active: boolean;
}): Promise<CoachingService> {
	const now = new Date().toISOString();
	const payload: Record<string, any> = {
		owner_id: 'admin',
		title: data.title,
		slug: data.slug,
		description: data.description,
		price: data.price,
		currency: 'HTG',
		is_free: data.isFree,
		duration_minutes: data.durationMinutes,
		active: data.active,
		created_at: now,
		updated_at: now,
	};

	const doc = await tables.createRow(
		DATABASE_ID,
		SERVICES_COLLECTION,
		ID.unique(),
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
		isFree: boolean;
		durationMinutes: number;
		active: boolean;
	}
): Promise<CoachingService> {
	const payload: Record<string, any> = {
		title: data.title,
		slug: data.slug,
		description: data.description,
		price: data.price,
		is_free: data.isFree,
		duration_minutes: data.durationMinutes,
		active: data.active,
		updated_at: new Date().toISOString(),
	};

	const updatedDoc = await tables.updateRow(
		DATABASE_ID,
		SERVICES_COLLECTION,
		id,
		payload
	);

	return mapServiceDoc(updatedDoc);
}

export async function deleteCoachingService(id: string): Promise<void> {
	// 1. Delete associated slots first
	try {
		const slotDocs = await tables.listRows(DATABASE_ID, SLOTS_COLLECTION, [
			Query.equal('service_id', id),
			Query.limit(100)
		]);
		for (const slotDoc of slotDocs.rows) {
			await tables.deleteRow(DATABASE_ID, SLOTS_COLLECTION, slotDoc.$id);
		}
	} catch (e) {
		console.warn(`[Appwrite Coaching Service] Associated slots cleanup for service ${id} skipped/failed:`, e);
	}

	// 2. Delete service document
	await tables.deleteRow(DATABASE_ID, SERVICES_COLLECTION, id);
}

/* ============================================================================
   2. COACHING SLOTS METHODS (Stored in UTC ISO)
   ============================================================================ */

export async function getCoachingSlots(serviceId: string): Promise<CoachingSlot[]> {
	try {
		const res = await tables.listRows(DATABASE_ID, SLOTS_COLLECTION, [
			Query.equal('service_id', serviceId),
			Query.orderAsc('start_at'),
			Query.limit(100)
		]);
		return res.rows.map((doc: any) => mapSlotDoc(doc));
	} catch (error) {
		console.warn(`[Appwrite Coaching Service] Could not fetch slots for service ${serviceId}:`, error);
		return [];
	}
}

export async function getAvailableCoachingSlots(serviceId: string): Promise<CoachingSlot[]> {
	try {
		const res = await tables.listRows(DATABASE_ID, SLOTS_COLLECTION, [
			Query.equal('service_id', serviceId),
			Query.equal('status', 'available'),
			Query.limit(100)
		]);
		return res.rows.map((doc: any) => mapSlotDoc(doc));
	} catch (error) {
		console.warn(`[Appwrite Coaching Service] Could not fetch available slots for service ${serviceId}:`, error);
		return [];
	}
}

export async function createCoachingSlot(
	serviceId: string,
	startAtISO: string,
	endAtISO: string,
	coachTimezone = 'America/Port-au-Prince'
): Promise<CoachingSlot> {
	const now = new Date().toISOString();
	const payload: Record<string, any> = {
		service_id: serviceId,
		start_at: startAtISO,
		end_at: endAtISO,
		coach_timezone: coachTimezone,
		status: 'available',
		created_at: now
	};

	let doc: any;
	try {
		doc = await tables.createRow(DATABASE_ID, SLOTS_COLLECTION, ID.unique(), payload);
	} catch (e: any) {
		console.warn('[Appwrite Coaching Service] tables.createRow failed for slot, trying databases.createDocument:', e?.message || e);
		try {
			doc = await databases.createDocument(DATABASE_ID, SLOTS_COLLECTION, ID.unique(), payload);
		} catch (dbErr: any) {
			console.error('[Appwrite Coaching Service] Failed to create coaching slot in Appwrite:', dbErr);
			if (dbErr?.code === 409 || e?.code === 409 || String(dbErr?.message || '').includes('already exists')) {
				throw new Error('Un créneau à cette même date et heure existe déjà pour cette offre.');
			}
			throw new Error(dbErr?.message || e?.message || "Erreur lors de l'ajout du créneau dans Appwrite.");
		}
	}

	return mapSlotDoc(doc);
}

export async function createCoachingSlotsBatch(
	serviceId: string,
	slotsToCreate: { startAt: string; endAt: string }[],
	coachTimezone = 'America/Port-au-Prince'
): Promise<CoachingSlot[]> {
	const createdSlots: CoachingSlot[] = [];
	for (const slot of slotsToCreate) {
		try {
			const created = await createCoachingSlot(serviceId, slot.startAt, slot.endAt, coachTimezone);
			createdSlots.push(created);
		} catch (err) {
			console.warn(`[Bulk Slot Creation] Skipped duplicate/error slot ${slot.startAt}:`, err);
		}
	}
	return createdSlots;
}

export async function deleteCoachingSlot(slotId: string): Promise<void> {
	await tables.deleteRow(DATABASE_ID, SLOTS_COLLECTION, slotId);
}

export async function updateSlotStatus(slotId: string, status: SlotStatus): Promise<void> {
	try {
		await tables.updateRow(DATABASE_ID, SLOTS_COLLECTION, slotId, { status });
	} catch (e) {
		console.warn(`[Appwrite Coaching Service] Could not update status for slot ${slotId}:`, e);
	}
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

	const payload = {
		user_id: 'admin',
		country: data.country,
		timezone: data.timezone,
		whatsapp: data.whatsapp,
		created_at: now,
		updated_at: now
	};

	let updatedDoc: any;

	if (existingDocId) {
		try {
			updatedDoc = await tables.updateRow(
				DATABASE_ID,
				SETTINGS_COLLECTION,
				existingDocId,
				payload
			);
		} catch (e: any) {
			console.warn('[Appwrite Coaching Service] tables.updateRow failed, trying databases.updateDocument:', e);
			try {
				updatedDoc = await databases.updateDocument(
					DATABASE_ID,
					SETTINGS_COLLECTION,
					existingDocId,
					payload
				);
			} catch (dbErr: any) {
				console.error('[Appwrite Coaching Service] Failed to update coaching settings:', dbErr);
				throw new Error(dbErr?.message || e?.message || 'Erreur lors de la mise à jour des paramètres.');
			}
		}
	} else {
		try {
			updatedDoc = await tables.createRow(
				DATABASE_ID,
				SETTINGS_COLLECTION,
				ID.unique(),
				payload
			);
		} catch (e: any) {
			console.warn('[Appwrite Coaching Service] tables.createRow failed, trying databases.createDocument:', e);
			try {
				updatedDoc = await databases.createDocument(
					DATABASE_ID,
					SETTINGS_COLLECTION,
					ID.unique(),
					payload
				);
			} catch (dbErr: any) {
				console.error('[Appwrite Coaching Service] Failed to create coaching settings:', dbErr);
				throw new Error(dbErr?.message || e?.message || 'Erreur lors de la création des paramètres.');
			}
		}
	}

	return mapSettingsDoc(updatedDoc);
}
