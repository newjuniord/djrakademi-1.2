import { json, type RequestHandler } from '@sveltejs/kit';
import { EbookServerError, getEbookCoverServer } from '$lib/server/ebooks';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const file = await getEbookCoverServer(params.id!);
		return new Response(file.bytes, {
			headers: {
				'Content-Type': file.mimeType,
				'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch (error) {
		const status = error instanceof EbookServerError ? error.status : 500;
		return json({ message: 'Couverture introuvable.' }, { status });
	}
};
