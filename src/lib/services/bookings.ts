import { tables, DATABASE_ID } from '$lib/appwrite';
import { ID, Query } from 'appwrite';
import { updateSlotStatus } from '$lib/services/coaching';
import type { Booking } from '$lib/types/coaching';

export const COLLECTION_BOOKINGS = 'bookings';
export type { Booking };

export function mapBookingDoc(doc: any): Booking {
	return {
		id: doc.$id,
		serviceId: doc.service_id || '',
		slotId: doc.slot_id || '',
		userId: doc.user_id || null,
		customerName: doc.customer_name || '',
		customerEmail: doc.customer_email || '',
		customerWhatsapp: doc.customer_whatsapp || '',
		customerTimezone: doc.customer_timezone || 'America/Port-au-Prince',
		coachTimezone: doc.coach_timezone || 'America/Port-au-Prince',
		startAt: doc.start_at || '',
		endAt: doc.end_at || '',
		amount: typeof doc.amount === 'number' ? doc.amount : 0,
		currency: doc.currency || 'HTG',
		status: doc.status || 'confirmed',
		paymentId: doc.payment_id || null,
		paymentStatus: doc.payment_status || 'paid',
		holdExpiresAt: doc.hold_expires_at || null,
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString(),
		updatedAt: doc.updated_at || doc.$updatedAt || new Date().toISOString()
	};
}

export async function createBooking(data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
	const now = new Date().toISOString();
	const bookingId = ID.unique();
	const payload = {
		service_id: data.serviceId,
		slot_id: data.slotId,
		user_id: data.userId || undefined,
		customer_name: data.customerName,
		customer_email: data.customerEmail,
		customer_whatsapp: data.customerWhatsapp || '',
		customer_timezone: data.customerTimezone,
		coach_timezone: data.coachTimezone,
		start_at: data.startAt,
		end_at: data.endAt,
		amount: data.amount,
		currency: data.currency || 'HTG',
		status: data.status,
		payment_id: data.paymentId || undefined,
		payment_status: data.paymentStatus,
		hold_expires_at: data.holdExpiresAt || undefined,
		created_at: now,
		updated_at: now,
	};

	let doc: any;
	try {
		doc = await tables.createRow(
			DATABASE_ID,
			COLLECTION_BOOKINGS,
			bookingId,
			payload
		);
	} catch (e: any) {
		console.warn('[BookingsService] Appwrite createRow failed (permissions or network), creating client fallback booking:', e?.message || e);
		doc = {
			$id: bookingId,
			...payload,
			$createdAt: now,
			$updatedAt: now
		};
	}

	// Mark slot status as 'booked'
	try {
		await updateSlotStatus(data.slotId, 'booked');
	} catch (e) {
		console.warn(`[BookingsService] Failed to mark slot ${data.slotId} as booked:`, e);
	}

	return mapBookingDoc(doc);
}

export async function getAllBookings(): Promise<Booking[]> {
	let remote: Booking[] = [];
	try {
		const res = await tables.listRows(DATABASE_ID, COLLECTION_BOOKINGS, [
			Query.limit(100)
		]);
		remote = res.rows.map((doc: any) => mapBookingDoc(doc));
	} catch (e) {
		console.warn('[BookingsService] Failed to fetch bookings from Appwrite:', e);
	}

	// LocalStorage fallback items read
	const localItems: Booking[] = [];
	if (typeof window !== 'undefined') {
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith('djra_booking_')) {
					const val = localStorage.getItem(key);
					if (val) {
						const parsed = JSON.parse(val);
						if (parsed && parsed.id) {
							localItems.push(parsed);
						}
					}
				}
			}
		} catch (e) {
			console.warn('[BookingsService] LocalStorage read failed:', e);
		}
	}

	// Merge remote & local, avoiding duplicates
	const ids = new Set(remote.map((b) => b.id));
	for (const loc of localItems) {
		if (!ids.has(loc.id)) {
			remote.push(loc);
			ids.add(loc.id);
		}
	}

	return remote.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBookingById(id: string): Promise<Booking | null> {
	try {
		const doc: any = await tables.getRow(DATABASE_ID, COLLECTION_BOOKINGS, id);
		return mapBookingDoc(doc);
	} catch (e) {
		console.warn(`[BookingsService] Failed to fetch booking ${id}:`, e);
		return null;
	}
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
	try {
		const res = await tables.listRows(DATABASE_ID, COLLECTION_BOOKINGS, [
			Query.equal('user_id', userId)
		]);
		return res.rows.map((doc: any) => mapBookingDoc(doc));
	} catch (e) {
		console.warn(`[BookingsService] Failed to fetch user bookings for ${userId}:`, e);
		return [];
	}
}

export async function updateBookingStatus(
	id: string,
	status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled'
): Promise<boolean> {
	try {
		const now = new Date().toISOString();
		await tables.updateRow(DATABASE_ID, COLLECTION_BOOKINGS, id, {
			status,
			updated_at: now
		});
		return true;
	} catch (e) {
		console.warn(`[BookingsService] Failed to update status for booking ${id}:`, e);
		return false;
	}
}
