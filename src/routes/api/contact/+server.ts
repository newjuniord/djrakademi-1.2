import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recentRequests = new Map<string, number>();

function clean(value: unknown, max: number): string {
	return String(value ?? '').trim().slice(0, max);
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const now = Date.now();
	const lastRequest = recentRequests.get(ip) || 0;
	if (now - lastRequest < 30_000) {
		return json({ message: 'Veuillez patienter avant d’envoyer un autre message.' }, { status: 429 });
	}

	let body: any;
	try { body = await request.json(); } catch {
		return json({ message: 'Données du formulaire invalides.' }, { status: 400 });
	}
	const name = clean(body?.name, 120);
	const email = clean(body?.email, 254).toLowerCase();
	const subject = clean(body?.subject, 160);
	const message = clean(body?.message, 5000);
	if (!name || name.length < 2 || !EMAIL_PATTERN.test(email) || !subject || !message || message.length < 10) {
		return json({ message: 'Veuillez compléter correctement tous les champs du formulaire.' }, { status: 400 });
	}

	const apiKey = env.RESEND_API_KEY?.trim();
	const to = env.CONTACT_TO_EMAIL?.trim() || 'contact@djrakademi.net';
	const from = env.CONTACT_FROM_EMAIL?.trim() || 'contact@djrakademi.net';
	if (!apiKey) return json({ message: 'Le service d’e-mail n’est pas configuré.' }, { status: 503 });
	if (!EMAIL_PATTERN.test(to) || !EMAIL_PATTERN.test(from)) {
		return json({ message: 'La configuration des adresses e-mail est invalide.' }, { status: 503 });
	}

	recentRequests.set(ip, now);
	for (const [key, timestamp] of recentRequests) if (now - timestamp > 60 * 60_000) recentRequests.delete(key);

	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from,
				to: [to],
				reply_to: email,
				subject: `[DJR Akademi] ${subject}`,
				text: `Nom : ${name}\nE-mail : ${email}\nSujet : ${subject}\n\n${message}`
			})
		});
		const result = await response.json().catch(() => ({}));
		if (!response.ok) {
			console.error('[Contact] Resend error:', response.status, result?.message || result?.name);
			return json({ message: 'Impossible d’envoyer le message pour le moment.' }, { status: 502 });
		}
		return json({ success: true, id: result?.id });
	} catch (error) {
		console.error('[Contact] Resend request failed:', error);
		return json({ message: 'Le service d’e-mail est momentanément indisponible.' }, { status: 502 });
	}
};
