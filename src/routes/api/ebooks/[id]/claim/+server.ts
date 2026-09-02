import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { claimFreeEbookServer, EbookServerError } from '$lib/server/ebooks';

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		return json(await claimFreeEbookServer(params.id!, user));
	} catch (error) {
		const status = error instanceof EbookServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ success: false, message: error instanceof Error ? error.message : 'Impossible de débloquer cet ebook.' }, { status });
	}
};
