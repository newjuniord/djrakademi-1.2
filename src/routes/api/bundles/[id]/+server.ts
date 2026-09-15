import { json, type RequestHandler } from '@sveltejs/kit';
import { getBundle } from '$lib/server/bundles';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const bundle = await getBundle(params.id || '');
		return bundle ? json({ bundle }) : json({ message: 'Bundle introuvable.' }, { status: 404 });
	} catch (error: any) {
		if (error?.code === 404) return json({ message: 'Bundle introuvable.' }, { status: 404 });
		console.error('[Bundle]', error);
		return json({ message: 'Bundle indisponible.' }, { status: 500 });
	}
};
