import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AdminServerError, requireAdmin } from '$lib/server/admin-appwrite';
import { getMarketingRecipients } from '$lib/server/marketing';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ request }) => {
	try {
		await requireAdmin(request);
		return json({ recipients: await getMarketingRecipients(), configured: Boolean(env.RESEND_API_KEY?.trim() && (env.MARKETING_FROM_EMAIL?.trim() || env.CONTACT_FROM_EMAIL?.trim()) && (env.CONTACT_TO_EMAIL?.trim() || env.CONTACT_FROM_EMAIL?.trim())) });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'Impossible de charger les destinataires.' }, { status: error instanceof AdminServerError ? error.status : 500 });
	}
};
