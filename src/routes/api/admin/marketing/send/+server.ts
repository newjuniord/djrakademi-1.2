import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AdminServerError, requireAdmin } from '$lib/server/admin-appwrite';
import { escapeHtml, getMarketingRecipients, marketingConfig, renderMarketingTemplate, resendHeaders } from '$lib/server/marketing';

type SendBody = { emails?: unknown; subject?: unknown; html?: unknown; lang?: unknown };

export const POST: RequestHandler = async ({ request }) => {
	try {
		await requireAdmin(request);
		const body = await request.json() as SendBody;
		const emails = Array.isArray(body.emails) ? [...new Set(body.emails.map((value) => String(value).trim().toLowerCase()))] : [];
		const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
		const html = typeof body.html === 'string' ? body.html.trim() : '';
		const lang = body.lang === 'ht' ? 'ht' : 'fr';
		if (!emails.length || emails.length > 100 || !subject || subject.length > 200 || !html || html.length > 100_000) {
			return json({ error: 'Choisissez de 1 à 100 destinataires et renseignez un objet et un modèle HTML valides.' }, { status: 400 });
		}
		const config = marketingConfig();
		const eligible = new Map((await getMarketingRecipients()).map((recipient) => [recipient.email, recipient]));
		if (emails.some((email) => !eligible.has(email))) {
			return json({ error: 'La sélection contient une adresse absente des comptes de la plateforme. Rechargez la liste.' }, { status: 409 });
		}
		const encoder = new TextEncoder();
		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				for (const email of emails) {
					const recipient = eligible.get(email)!;
					controller.enqueue(encoder.encode(JSON.stringify({ email, status: 'sending' }) + '\n'));
					const unsubscribeUrl = `mailto:${config.unsubscribeEmail}?subject=${encodeURIComponent(lang === 'ht' ? 'Demann dezabònman' : 'Demande de désabonnement')}&body=${encodeURIComponent(email)}`;
					const rendered = renderMarketingTemplate(html, recipient, unsubscribeUrl);
					const footer = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #ddd;color:#666;font-size:12px"><p>DJR Akademi · ${lang === 'ht' ? 'Ou resevwa mesaj sa a paske ou gen yon kont sou platfòm nou an.' : 'Vous recevez ce message parce que vous avez un compte sur notre plateforme.'}</p><p><a href="${escapeHtml(unsubscribeUrl)}">${lang === 'ht' ? 'Mande dezabònman' : 'Demander le désabonnement'}</a></p></div>`;
					const personalizedSubject = subject.replace(/\[(name|email)\]/gi, (_, key: string) => recipient[key.toLowerCase() as 'name' | 'email']);
					try {
						const response = await fetch('https://api.resend.com/emails', {
							method: 'POST',
							headers: resendHeaders(config.apiKey),
							body: JSON.stringify({
								from: config.from,
								to: [email],
								subject: personalizedSubject,
								html: rendered + footer,
								text: `${rendered.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n\n${lang === 'ht' ? 'Mande dezabònman' : 'Demander le désabonnement'} : ${unsubscribeUrl}`,
								headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` }
							})
						});
						const result = await response.json().catch(() => ({})) as { message?: string; id?: string };
						controller.enqueue(encoder.encode(JSON.stringify({ email, status: response.ok ? 'success' : 'error', error: response.ok ? undefined : result.message || `Resend : ${response.status}` }) + '\n'));
					} catch (error) {
						controller.enqueue(encoder.encode(JSON.stringify({ email, status: 'error', error: error instanceof Error ? error.message : 'Connexion à Resend impossible.' }) + '\n'));
					}
					await new Promise((resolve) => setTimeout(resolve, 600));
				}
				controller.close();
			}
		});
		return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'Envoi impossible.' }, { status: error instanceof AdminServerError ? error.status : 500 });
	}
};
