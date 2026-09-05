import { account } from '$lib/appwrite';
import { adminRequest } from '$lib/admin/admin-client';
import type {
	CreateSupportMessageParams,
	SupportMessage,
	SupportPreset,
	SupportStatusResponse,
	SupportTicketStatus
} from '$lib/types/support';

export async function supportJwt(): Promise<string> {
	return (await account.createJWT()).jwt;
}

export interface UserSupportOrder {
	id: string;
	productType: 'course' | 'ebook' | 'coaching';
	productTitle: string;
	amount: number;
	currency: string;
	status: 'pending' | 'paid' | 'failed' | 'expired';
	paymentProvider: string;
	createdAt: string;
}

export interface ExtendedSupportStatusResponse extends SupportStatusResponse {
	presets: SupportPreset[];
	orders: UserSupportOrder[];
}

export async function fetchUserSupportStatus(): Promise<ExtendedSupportStatusResponse | null> {
	try {
		const jwt = await supportJwt();
		const response = await fetch('/api/support', {
			method: 'GET',
			headers: { Authorization: `Bearer ${jwt}` }
		});
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}

export async function submitUserSupportMessage(
	params: CreateSupportMessageParams
): Promise<{ success: boolean; message?: SupportMessage; error?: string }> {
	try {
		const jwt = await supportJwt();
		const response = await fetch('/api/support', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${jwt}`
			},
			body: JSON.stringify(params)
		});
		const data = await response.json();
		if (!response.ok || !data.success) {
			return { success: false, error: data.message || 'Erreur lors de l’envoi du message de support.' };
		}
		return { success: true, message: data.message };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Erreur de connexion au serveur.'
		};
	}
}

export async function getAdminSupportTickets(
	statusFilter: SupportTicketStatus | 'all' = 'all'
): Promise<SupportMessage[]> {
	return adminRequest(`/support?status=${encodeURIComponent(statusFilter)}`);
}

export async function updateAdminSupportTicket(
	ticketId: string,
	params: { status?: SupportTicketStatus; adminReply?: string }
): Promise<SupportMessage> {
	return adminRequest(`/support/${encodeURIComponent(ticketId)}`, {
		method: 'PATCH',
		body: JSON.stringify(params)
	});
}
