import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { claimFreeEbookServer, EbookServerError } from '$lib/server/ebooks';
import { isPurchaseMaintenanceEnabled, MAINTENANCE_MESSAGE } from '$lib/server/maintenance';

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		if (await isPurchaseMaintenanceEnabled()) {
			throw new EbookServerError(MAINTENANCE_MESSAGE, 503);
		}
		return json(await claimFreeEbookServer(params.id!, user));
	} catch (error) {
		const status = error instanceof EbookServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ success: false, message: error instanceof Error ? error.message : 'Impossible de débloquer cet ebook.' }, { status });
	}
};
