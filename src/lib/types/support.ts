export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportPreset {
	id: string;
	label: string;
	description: string;
	requiresWhatsapp?: boolean;
	suggestedProductType?: 'course' | 'ebook' | 'coaching';
}

export interface SupportMessage {
	id: string;
	userId: string;
	orderId?: string;
	productType?: 'course' | 'ebook' | 'coaching';
	productTitle?: string;
	presetId: string;
	presetLabel: string;
	whatsapp?: string;
	status: SupportTicketStatus;
	adminReply?: string;
	createdAt: string;
	updatedAt: string;
}

export interface SupportStatusResponse {
	eligible: boolean;
	orderCount: number;
	dailyQuota: {
		used: number;
		max: number;
		remaining: number;
	};
	messages: SupportMessage[];
}

export interface CreateSupportMessageParams {
	orderId?: string;
	presetId: string;
	whatsapp?: string;
}
