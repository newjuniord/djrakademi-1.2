import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { getOrCreateProfileServer, ProfileServerError, updateOwnedProfileServer } from '$lib/server/profiles';

function errorResponse(error: unknown) {
	const status = error instanceof ProfileServerError || error instanceof PaymentServerError ? error.status : 500;
	return json({ message: error instanceof Error ? error.message : 'Impossible de charger le profil.' }, { status });
}

export const GET: RequestHandler = async ({ request }) => {
	try {
		return json(await getOrCreateProfileServer(await requirePaymentUser(request)));
	} catch (error) {
		return errorResponse(error);
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const user = await requirePaymentUser(request);
		return json(await updateOwnedProfileServer(user, await request.json()));
	} catch (error) {
		return errorResponse(error);
	}
};
