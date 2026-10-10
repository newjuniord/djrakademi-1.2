import type { Handle } from '@sveltejs/kit';

export const handle: Handle = ({ event, resolve }) => {
	if (/^\/admin\/support\/?$/.test(event.url.pathname)) {
		return new Response(null, { status: 404 });
	}
	const language = event.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('<html lang="fr"', `<html lang="${language}"`)
	});
};
