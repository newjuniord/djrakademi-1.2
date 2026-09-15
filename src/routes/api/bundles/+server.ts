import { json, type RequestHandler } from '@sveltejs/kit';
import { listBundles } from '$lib/server/bundles';

export const GET: RequestHandler = async () => {
	try { return json({ bundles: await listBundles() }, { headers: { 'cache-control': 'public, max-age=60' } }); }
	catch (error) { console.error('[Bundles]', error); return json({ bundles: [], message: 'Bundles indisponibles.' }, { status: 500 }); }
};
