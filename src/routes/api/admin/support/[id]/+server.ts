import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin, AdminServerError } from '$lib/server/admin-appwrite';
import { updateAdminSupportMessageServer } from '$lib/server/support';
import type { SupportTicketStatus } from '$lib/types/support';

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		await requireAdmin(request);
		const id = params.id || '';
		if (!id) return json({ message: 'ID du ticket manquant.' }, { status: 400 });

		const body = await request.json().catch(() => ({}));
		const status = body?.status as SupportTicketStatus | undefined;
		const adminReply = typeof body?.adminReply === 'string' ? body.adminReply : undefined;

		const updated = await updateAdminSupportMessageServer(id, { status, adminReply });
		return json(updated);
	} catch (error) {
		const status = error instanceof AdminServerError ? error.status : 500;
		const message = error instanceof Error ? error.message : 'Erreur de mise à jour du ticket.';
		return json({ message }, { status });
	}
};
