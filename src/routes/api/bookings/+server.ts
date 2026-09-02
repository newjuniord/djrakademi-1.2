import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { BookingServerError, createBookingServer } from '$lib/server/bookings';
import { isPurchaseMaintenanceEnabled, MAINTENANCE_MESSAGE } from '$lib/server/maintenance';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const user = await requirePaymentUser(request);
		if (await isPurchaseMaintenanceEnabled()) {
			throw new BookingServerError(MAINTENANCE_MESSAGE, 503);
		}
		return json(await createBookingServer(await request.json(), user), { status: 201 });
	} catch (error) {
		const status = error instanceof BookingServerError || error instanceof PaymentServerError ? error.status : 500;
		if (status >= 500) console.error('[Booking API]', error);
		return json({ message: error instanceof Error ? error.message : 'Impossible de créer la réservation.' }, { status });
	}
};
