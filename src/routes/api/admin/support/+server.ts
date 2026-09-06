import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, AdminServerError } from '$lib/server/admin-appwrite';
import { getAdminSupportMessagesServer, purgeOldSupportMessagesServer } from '$lib/server/support';
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

export const DELETE: RequestHandler = async ({ request, url }) => {
	try {
		await requireAdmin(request);
		const days = parseInt(url.searchParams.get('days') || '30', 10);
		const statusFilter = (url.searchParams.get('status') || 'all') as SupportTicketStatus | 'all';
		const result = await purgeOldSupportMessagesServer(days, statusFilter);
		return json({ success: true, deleted: result.deleted });
	} catch (error) {
		const status = error instanceof AdminServerError ? error.status : 500;
		const message = error instanceof Error ? error.message : 'Erreur lors de la purge.';
		return json({ success: false, message }, { status });
	}
};
