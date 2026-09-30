import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, AdminServerError } from '$lib/server/admin-appwrite';
import { normalizeWhatsappNumber, sendWhatsappMessage } from '$lib/server/whatsapp-message';

export const POST: RequestHandler = async ({ request }) => {
	try {
		await requireAdmin(request);
		const body = await request.json();
		const number = typeof body?.number === 'string' ? body.number : '';
		const text = typeof body?.text === 'string' ? body.text : '';
		if (!normalizeWhatsappNumber(number) || !text.trim() || text.length > 10_000) return json({ message: 'Numéro ou message invalide.' }, { status: 400 });
		const sent = await sendWhatsappMessage(number, text, 'Envoi manuel administrateur');
		return json({ sent, message: sent ? 'success' : 'Échec de l’envoi WhatsApp.' }, { status: sent ? 200 : 502 });
	} catch (error) {
		const status = error instanceof AdminServerError ? error.status : error instanceof SyntaxError ? 400 : 500;
		if (status >= 500) console.error('[WhatsApp API]', error);
		return json({ message: status === 400 ? 'Données invalides.' : status === 500 ? 'Envoi impossible.' : error instanceof Error ? error.message : 'Accès refusé.' }, { status });
	}
};
