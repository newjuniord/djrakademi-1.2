import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { EbookServerError, hasEbookAccessServer } from '$lib/server/ebooks';

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		return json({ owned: await hasEbookAccessServer(params.id!, user.$id) });
	} catch (error) {
		const status = error instanceof EbookServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ owned: false, message: error instanceof Error ? error.message : 'Vérification impossible.' }, { status });
	}
};
