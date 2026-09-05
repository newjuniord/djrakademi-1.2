import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, AdminServerError } from '$lib/server/admin-appwrite';
import { getAdminSupportMessagesServer } from '$lib/server/support';
import type { SupportTicketStatus } from '$lib/types/support';

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		await requireAdmin(request);
		const statusFilter = (url.searchParams.get('status') || 'all') as SupportTicketStatus | 'all';
		const messages = await getAdminSupportMessagesServer(statusFilter);
		return json(messages);
	} catch (error) {
		const status = error instanceof AdminServerError ? error.status : 500;
		const message = error instanceof Error ? error.message : 'Erreur de chargement des messages de support.';
		return json({ message }, { status });
	}
};
