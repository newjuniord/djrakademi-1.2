import { account } from '$lib/appwrite';
import type { Booking, BookingCustomerInput } from '$lib/types/coaching';

type BookingStart = {
	bookingId: string;
	status: 'pending_payment' | 'confirmed';
	holdExpiresAt: string | null;
	amount: number;
	currency: 'HTG';
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const jwt = (await account.createJWT()).jwt;
	const response = await fetch(endpoint, {
		...options,
		headers: { 'content-type': 'application/json', Authorization: `Bearer ${jwt}`, ...(options.headers || {}) }
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'Le service de réservation est indisponible.');
	return data as T;
}

export function startBooking(slotId: string, customer: BookingCustomerInput): Promise<BookingStart> {
	return request<BookingStart>('/api/bookings', {
		method: 'POST',
		body: JSON.stringify({
			slotId,
			customerName: customer.name,
			customerWhatsapp: customer.whatsapp,
			customerTimezone: customer.timezone
		})
	});
}

export function getOwnedBooking(bookingId: string): Promise<{ booking: Booking; serviceTitle: string; supportWhatsapp: string }> {
	return request(`/api/bookings/${encodeURIComponent(bookingId)}`);
}
