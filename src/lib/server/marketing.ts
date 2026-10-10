import { env } from '$env/dynamic/private';
import { Query } from 'node-appwrite';
import { adminServices, AdminServerError, listAllRows } from '$lib/server/admin-appwrite';

export type MarketingRecipient = { email: string; name: string; hasPurchased: boolean };

export function marketingConfig() {
	const apiKey = env.RESEND_API_KEY?.trim();
	const from = env.MARKETING_FROM_EMAIL?.trim() || env.CONTACT_FROM_EMAIL?.trim();
	const unsubscribeEmail = env.CONTACT_TO_EMAIL?.trim() || env.CONTACT_FROM_EMAIL?.trim();
	if (!apiKey || !from || !unsubscribeEmail) {
		throw new AdminServerError('Configurez RESEND_API_KEY et les adresses e-mail de contact.', 503);
	}
	return { apiKey, from, unsubscribeEmail };
}

export function resendHeaders(apiKey: string) {
	return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
}

export async function getMarketingRecipients(): Promise<MarketingRecipient[]> {
	const { tables, users } = adminServices();
	const [profiles, orders] = await Promise.all([
		listAllRows(tables, 'profiles'),
		listAllRows(tables, 'orders', [Query.equal('status', 'paid')])
	]);
	const authUsers: any[] = [];
	let cursor: string | undefined;
	do {
		const page = await users.list({ queries: [Query.orderAsc('$id'), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])] });
		authUsers.push(...page.users);
		cursor = page.users.length === 100 ? page.users[page.users.length - 1].$id : undefined;
	} while (cursor);
	const profileByEmail = new Map<string, any>();
	const profileByUserId = new Map<string, any>();
	for (const profile of profiles) {
		if (profile.email) profileByEmail.set(String(profile.email).trim().toLowerCase(), profile);
		if (profile.user_id) profileByUserId.set(String(profile.user_id), profile);
	}
	const buyerEmails = new Set<string>();
	const buyerUserIds = new Set<string>();
	for (const order of orders) {
		if (order.customer_email) buyerEmails.add(String(order.customer_email).trim().toLowerCase());
		if (order.user_id) buyerUserIds.add(String(order.user_id));
		const profile = profileByUserId.get(String(order.user_id || ''));
		if (profile?.email) buyerEmails.add(String(profile.email).trim().toLowerCase());
	}
	const recipients = new Map<string, MarketingRecipient>();
	for (const user of authUsers) {
		const email = String(user.email || '').trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
		const profile = profileByUserId.get(String(user.$id)) || profileByEmail.get(email);
		const name = String(profile?.name || user.name || email.split('@')[0]).replace(/\s+/g, ' ').trim();
		recipients.set(email, { email, name, hasPurchased: buyerEmails.has(email) || buyerUserIds.has(String(user.$id)) });
	}
	return [...recipients.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
}

export function renderMarketingTemplate(template: string, recipient: MarketingRecipient, unsubscribeUrl: string) {
	return template.replace(/\[(name|email|unsubscribe_url)\]/gi, (_, key: string) => {
		if (key.toLowerCase() === 'unsubscribe_url') return escapeHtml(unsubscribeUrl);
		return escapeHtml(recipient[key.toLowerCase() as 'name' | 'email']);
	});
}
