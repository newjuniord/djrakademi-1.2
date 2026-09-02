import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Query } from 'node-appwrite';
import { adminServices } from '$lib/server/admin-appwrite';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE = 'Si un compte correspond à cette adresse, un lien de récupération vient d’être envoyé.';
const recentRequests = new Map<string, number>();

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
	}[character]!));
}

function appOrigin(): string {
	const url = new URL((env.APP_URL || 'https://djrakademi.net').trim());
	if (!['http:', 'https:'].includes(url.protocol)) throw new Error('APP_URL invalide.');
	return url.origin;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return json({ message: GENERIC_MESSAGE }); }
	const email = String((body as { email?: unknown })?.email || '').trim().toLowerCase().slice(0, 254);
	if (!EMAIL_PATTERN.test(email)) return json({ message: GENERIC_MESSAGE });

	const now = Date.now();
	const rateKey = `${getClientAddress()}:${email}`;
	if (now - (recentRequests.get(rateKey) || 0) < 60_000) return json({ message: GENERIC_MESSAGE });
	recentRequests.set(rateKey, now);
	for (const [key, timestamp] of recentRequests) if (now - timestamp > 60 * 60_000) recentRequests.delete(key);

	try {
		const { users } = adminServices();
		const result = await users.list({ queries: [Query.equal('email', email), Query.limit(1)] });
		const user = result.users[0];
		if (!user) return json({ message: GENERIC_MESSAGE });
		const apiKey = env.RESEND_API_KEY?.trim();
		if (!apiKey) throw new Error('RESEND_API_KEY n’est pas configurée.');
		const token = await users.createToken({ userId: user.$id, length: 64, expire: 60 * 60 });
		const resetUrl = new URL('/account/recovery', appOrigin());
		resetUrl.searchParams.set('userId', user.$id);
		resetUrl.searchParams.set('secret', token.secret);
		const name = escapeHtml(user.name || 'Client');
		const support = env.CONTACT_TO_EMAIL?.trim() || 'contact@djrakademi.net';
		const from = env.PASSWORD_RESET_FROM_EMAIL?.trim() || 'DJR Akademi <noreply@djrakademi.net>';

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 12_000);
		try {
			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, signal: controller.signal,
				body: JSON.stringify({
					from, to: [email], reply_to: support,
					subject: 'Réinitialisation de votre mot de passe DJR Akademi',
					text: `Bonjour ${user.name || 'Client'},\n\nUne demande de réinitialisation a été effectuée pour votre compte DJR Akademi.\n\nCréer un nouveau mot de passe (lien personnel valable 1 heure) :\n${resetUrl}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail. Votre mot de passe ne sera pas modifié.\n\nDJR Akademi`,
					html: `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><div style="display:none;max-height:0;overflow:hidden">Créez un nouveau mot de passe pour votre compte DJR Akademi.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="background:#18181b;padding:26px 32px;color:#fff"><div style="font-size:22px;font-weight:800">DJR Akademi</div><div style="margin-top:6px;color:#d4d4d8">Sécurité du compte</div></td></tr><tr><td style="padding:32px"><p style="margin:0 0 16px">Bonjour ${name},</p><h1 style="font-size:23px;line-height:1.3;margin:0 0 14px">Réinitialisez votre mot de passe</h1><p style="line-height:1.6;color:#52525b">Nous avons reçu une demande de nouveau mot de passe pour votre compte.</p><p style="margin:26px 0"><a href="${escapeHtml(resetUrl.toString())}" style="display:inline-block;background:#fbbf24;color:#18181b;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:9px">Créer un nouveau mot de passe</a></p><p style="font-size:13px;color:#71717a;line-height:1.6">Ce lien est personnel, utilisable une seule fois et expire dans 1 heure. Si vous n’avez pas demandé cette modification, ignorez cet e-mail.</p><hr style="border:0;border-top:1px solid #e4e4e7;margin:28px 0"><p style="font-size:12px;color:#71717a">Pour votre sécurité, ne transmettez jamais ce message ni son lien.</p></td></tr></table></td></tr></table></body></html>`
				})
			});
			const resendResult = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(resendResult?.message || `Resend HTTP ${response.status}`);
		} finally { clearTimeout(timeout); }
	} catch (error) {
		console.error('[Password recovery request]:', error instanceof Error ? error.message : error);
	}
	return json({ success: true, message: GENERIC_MESSAGE });
};
