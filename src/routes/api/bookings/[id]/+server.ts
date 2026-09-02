import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { BookingServerError, getOwnedBookingServer } from '$lib/server/bookings';

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		return json(await getOwnedBookingServer(params.id!, user.$id));
	} catch (error) {
		const status = error instanceof BookingServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Impossible de charger la réservation.' }, { status });
	}
};
