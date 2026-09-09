import { env } from '$env/dynamic/private';
import type { Order } from '$lib/services/orders';
import { adminServices } from '$lib/server/admin-appwrite';
import { getEbookFileServer } from '$lib/server/ebooks';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_APP_URL = 'https://djrakademi.net';
const DEFAULT_FROM = 'DJR Akademi <contact@djrakademi.net>';
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
	const chunkSize = 3 * 8192;
	let encoded = '';
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		encoded += btoa(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
	}
	return encoded;
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
	}[character]!));
}

function publicAppUrl(): string {
	const configured = (env.APP_URL || DEFAULT_APP_URL).trim().replace(/\/$/, '');
	try {
		const url = new URL(configured);
		if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
		return url.origin;
	} catch {
		throw new Error('APP_URL doit être une URL HTTP(S) valide.');
	}
}

function productDestination(order: Order): string {
	if (order.productType === 'course') return `/learn/${encodeURIComponent(order.productId)}`;
	if (order.productType === 'ebook') return `/ebooks/${encodeURIComponent(order.productId)}`;
	return `/booking/${encodeURIComponent(order.productId)}/success`;
}

function productLabel(order: Order): string {
	if (order.productType === 'course') return 'votre formation';
	if (order.productType === 'ebook') return 'votre ebook';
	return 'votre rendez-vous de coaching';
}

import { createPurchaseAccessToken } from '$lib/server/purchase-token';

function magicUrl(origin: string, orderId: string, userId: string, token: string, next: string, downloadEbook?: string): string {
	const url = new URL('/account/purchase-access', origin);
	url.searchParams.set('orderId', orderId);
	url.searchParams.set('userId', userId);
	url.searchParams.set('token', token);
	url.searchParams.set('next', next);
	if (downloadEbook) url.searchParams.set('downloadEbook', downloadEbook);
	return url.toString();
}

export interface PurchaseEmailResult {
	sent: boolean;
	attachmentIncluded: boolean;
}

export async function sendPurchaseConfirmationEmail(order: Order): Promise<PurchaseEmailResult> {
	const apiKey = env.RESEND_API_KEY?.trim();
	const fromValue = env.PURCHASE_FROM_EMAIL?.trim() || env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM;
	const from = fromValue.includes('<') ? fromValue : 'DJR Akademi <' + fromValue + '>'; 
	const replyTo = env.CONTACT_TO_EMAIL?.trim() || 'contact@djrakademi.net';
	if (!apiKey) throw new Error('RESEND_API_KEY n’est pas configurée.');
	if (!order.userId) throw new Error('La commande ne contient pas d’utilisateur.');
	if (!EMAIL_PATTERN.test(order.customerEmail) || !EMAIL_PATTERN.test(replyTo)) throw new Error('Adresse e-mail de commande invalide.');

	const token = createPurchaseAccessToken(order.id, order.userId);
	const origin = publicAppUrl();
	const destination = productDestination(order);
	const accessUrl = magicUrl(origin, order.id, order.userId, token, destination);
	const downloadUrl = order.productType === 'ebook'
		? magicUrl(origin, order.id, order.userId, token, destination, order.productId)
		: undefined;

	let attachment: { filename: string; content: string } | undefined;
	if (order.productType === 'ebook') {
		try {
			const file = await getEbookFileServer(order.productId, order.userId);
			if (file.bytes.byteLength <= MAX_ATTACHMENT_BYTES) attachment = { filename: file.filename, content: bytesToBase64(new Uint8Array(file.bytes)) };
		} catch (error) {
			console.warn('[Purchase email] Ebook attachment unavailable:', error instanceof Error ? error.message : error);
		}
	}

	const name = escapeHtml(order.customerName || 'Client');
	const title = escapeHtml(order.productTitle);
	const label = productLabel(order);
	const amount = `${Number(order.amount).toLocaleString('fr-FR')} ${order.currency || 'HTG'}`;
	const ebookSection = downloadUrl ? `<p style="margin:22px 0 8px"><a href="${escapeHtml(downloadUrl)}" style="color:#92400e;font-weight:700">Télécharger l’ebook en PDF</a></p><p style="margin:0;color:#6b7280;font-size:13px">${attachment ? 'Le PDF est également joint à cet e-mail.' : 'Le PDF est disponible via ce lien sécurisé.'}</p>` : '';
	const text = [
		`Bonjour ${order.customerName || 'Client'},`, '', `Votre paiement de ${amount} a été confirmé.`,
		`${order.productTitle} est maintenant disponible.`, '',
		`Accéder à ${label} (lien d'accès permanent) :`, accessUrl,
		...(downloadUrl ? ['', 'Télécharger votre ebook :', downloadUrl, attachment ? 'Le PDF est aussi joint à cet e-mail.' : ''] : []),
		'', `Commande : ${order.id}`, '', 'Besoin d’aide ? Répondez simplement à cet e-mail.', 'DJR Akademi'
	].join('\n');

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12_000);
	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, signal: controller.signal,
			body: JSON.stringify({
				from, to: [order.customerEmail], reply_to: replyTo,
				subject: `Votre achat est disponible — ${order.productTitle}`, text,
				html: `<!doctype html><html lang="ht"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><div style="display:none;max-height:0;overflow:hidden">Votre achat DJR Akademi est maintenant disponible.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="background:#18181b;padding:26px 32px;color:#fff"><div style="font-size:22px;font-weight:800">DJR Akademi</div><div style="margin-top:6px;color:#d4d4d8">Paiement confirmé</div></td></tr><tr><td style="padding:32px"><p style="margin:0 0 16px">Bonjour ${name},</p><h1 style="font-size:23px;line-height:1.3;margin:0 0 14px">Votre achat est prêt</h1><p style="line-height:1.6;color:#52525b">Le paiement de <strong>${escapeHtml(amount)}</strong> pour <strong>${title}</strong> a bien été confirmé.</p><p style="margin:26px 0"><a href="${escapeHtml(accessUrl)}" style="display:inline-block;background:#fbbf24;color:#18181b;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:9px">Accéder à ${escapeHtml(label)}</a></p><p style="font-size:13px;color:#71717a;line-height:1.5">Ce lien vous connecte directement à votre espace. Vous pouvez le conserver et l'utiliser à tout moment pour accéder à votre contenu sans limite de durée.</p>${ebookSection}<hr style="border:0;border-top:1px solid #e4e4e7;margin:28px 0"><p style="font-size:13px;color:#71717a;line-height:1.6">Commande <strong>${escapeHtml(order.id)}</strong><br>Besoin d’aide ? Répondez simplement à cet e-mail.</p></td></tr><tr><td style="background:#fafafa;padding:18px 32px;color:#71717a;font-size:12px">E-mail transactionnel envoyé à la suite de votre achat sur DJR Akademi.</td></tr></table></td></tr></table></body></html>`,
				...(attachment ? { attachments: [attachment] } : {})
			})
		});
		const result = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(result?.message || `Resend a répondu avec le statut ${response.status}.`);
		return { sent: true, attachmentIncluded: Boolean(attachment) };
	} finally { clearTimeout(timeout); }
}
