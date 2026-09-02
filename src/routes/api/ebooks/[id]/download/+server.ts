import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { EbookServerError, getEbookFileServer } from '$lib/server/ebooks';

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		const file = await getEbookFileServer(params.id!, user.$id);
		return new Response(file.bytes, {
			headers: {
				'Content-Type': file.mimeType,
				'Content-Disposition': `attachment; filename="${file.filename}"`,
				'Cache-Control': 'private, no-store',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch (error) {
		const status = error instanceof EbookServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Téléchargement impossible.' }, { status });
	}
};
