import { adminServices, DATABASE_ID, ID, Query } from '$lib/server/admin-appwrite';
import type {
	SupportMessage,
	SupportPreset,
	SupportStatusResponse,
	SupportTicketStatus
} from '$lib/types/support';

export class SupportServerError extends Error {
	constructor(message: string, public status = 500) {
		super(message);
		this.name = 'SupportServerError';
	}
}

export const SUPPORT_PRESETS: SupportPreset[] = [
	{
		id: 'no_access_after_payment',
		label: 'Mwen peye men mwen pa jwenn aksè nan pwodui an',
		description: 'Peman an te reyalize ak siksè men aksè a pa debloke otomatikman nan kont lan.'
	},
	{
		id: 'pending_transaction_help',
		label: 'Mwen fè peman an e tranzaksyon an toujou "pending"',
		description: 'Tranzaksyon an toujou an sispann sou MonCash, NatCash oswa Kat.'
	},
	{
		id: 'coaching_booking_issue',
		label: 'Mwen gen yon pwoblèm ak rezèvasyon coaching mwen an',
		description: 'Demann asistans rapid pou yon seye coaching.',
		requiresWhatsapp: true,
		suggestedProductType: 'coaching'
	},

];

export function mapSupportMessage(row: any, userEmail?: string): SupportMessage {
	return {
		id: row.$id,
		userId: row.user_id || '',
		userEmail: userEmail || undefined,
		orderId: row.order_id || undefined,
		productType: row.product_type || undefined,
		productTitle: row.product_title || undefined,
		presetId: row.preset_id || '',
		presetLabel: row.preset_label || '',
		whatsapp: row.whatsapp || undefined,
		status: (row.status as SupportTicketStatus) || 'open',
		adminReply: row.admin_reply || undefined,
		createdAt: row.created_at || row.$createdAt,
		updatedAt: row.updated_at || row.$updatedAt
	};
}

export async function getSupportUserStatusServer(userId: string): Promise<SupportStatusResponse> {
	const { tables } = adminServices();

	// 1. Check order count eligibility
	let orderCount = 0;
	try {
		const orderRes = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'orders',
			queries: [Query.equal('user_id', userId), Query.limit(100)]
		});
		orderCount = orderRes.rows.length;
	} catch {
		orderCount = 0;
	}

	const eligible = orderCount > 0;

	// 2. Calculate daily quota (max 3 messages per UTC day)
	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);
	const todayIso = todayStart.toISOString();

	let userMessages: SupportMessage[] = [];
	try {
		const msgsRes = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'support_messages',
			queries: [Query.equal('user_id', userId), Query.orderDesc('created_at'), Query.limit(50)]
		});
		userMessages = msgsRes.rows.map((row: any) => mapSupportMessage(row));
	} catch {
		userMessages = [];
	}

	const todayCount = userMessages.filter(
		(msg) => new Date(msg.createdAt).getTime() >= todayStart.getTime()
	).length;

	const remaining = Math.max(0, 3 - todayCount);

	return {
		eligible,
		orderCount,
		dailyQuota: {
			used: todayCount,
			max: 3,
			remaining
		},
		messages: userMessages
	};
}

export async function createSupportMessageServer(
	userId: string,
	params: { orderId?: string; presetId: string; whatsapp?: string }
): Promise<SupportMessage> {
	const statusRes = await getSupportUserStatusServer(userId);

	if (!statusRes.eligible) {
		throw new SupportServerError(
			'Ou dwe te kreye omwen yon tranzaksyon (menm si li en sispann oswa echwe) pou w ka sèvi ak sipò sa a.',
			403
		);
	}

	if (statusRes.dailyQuota.remaining <= 0) {
		throw new SupportServerError(
			'Ou rive nan limit 3 mesaj sipò pou jodi a. Tanpri re-eseye demen si w gen lòt kesyon.',
			429
		);
	}

	const preset = SUPPORT_PRESETS.find((p) => p.id === params.presetId);
	if (!preset) {
		throw new SupportServerError('Mesaj automatize invalide.', 400);
	}

	let productType: 'course' | 'ebook' | 'coaching' | undefined;
	let productTitle: string | undefined;
	let orderId = params.orderId;

	const { tables } = adminServices();

	if (orderId) {
		try {
			const order: any = await tables.getRow({
				databaseId: DATABASE_ID,
				tableId: 'orders',
				rowId: orderId
			});
			if (order && order.user_id === userId) {
				productType = order.product_type;
				productTitle = order.product_title;
			}
		} catch {
			/* Order not found, proceed without order coupling */
		}
	}

	const whatsappClean = String(params.whatsapp || '').trim();
	if (preset.requiresWhatsapp || productType === 'coaching') {
		if (!whatsappClean || whatsappClean.length < 8) {
			throw new SupportServerError(
				'Yon nimewo WhatsApp valid obligatwa pou asistans sa a.',
				400
			);
		}
	}

	const now = new Date().toISOString();

	try {
		const row = await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: 'support_messages',
			rowId: ID.unique(),
			data: {
				user_id: userId,
				order_id: orderId || undefined,
				product_type: productType || undefined,
				product_title: productTitle || undefined,
				preset_id: preset.id,
				preset_label: preset.label,
				whatsapp: whatsappClean || undefined,
				status: 'open',
				created_at: now,
				updated_at: now
			}
		});
		return mapSupportMessage(row);
	} catch (error) {
		console.error('[Support Message Create Error]:', error);
		throw new SupportServerError('Impossible de créer le message de support.', 500);
	}
}

export async function getAdminSupportMessagesServer(
	statusFilter?: SupportTicketStatus | 'all'
): Promise<SupportMessage[]> {
	const { tables } = adminServices();
	const queries = [Query.orderDesc('created_at'), Query.limit(100)];
	if (statusFilter && statusFilter !== 'all') {
		queries.push(Query.equal('status', statusFilter));
	}
	try {
		const res = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'support_messages',
			queries
		});

		// Batch-fetch emails from profiles table
		const userIds = [...new Set(res.rows.map((r: any) => r.user_id).filter(Boolean))];
		const emailMap: Record<string, string> = {};
		if (userIds.length > 0) {
			try {
				const profilesRes = await tables.listRows({
					databaseId: DATABASE_ID,
					tableId: 'profiles',
					queries: [Query.equal('user_id', userIds as string[]), Query.limit(100)]
				});
				for (const p of profilesRes.rows) {
					if (p.user_id && p.email) emailMap[p.user_id] = p.email;
				}
			} catch {
				// profiles fetch failed, continue without emails
			}
		}

		return res.rows.map((row: any) => mapSupportMessage(row, emailMap[row.user_id]));
	} catch (error) {
		console.error('[Admin Support Messages List Error]:', error);
		return [];
	}
}

export async function updateAdminSupportMessageServer(
	ticketId: string,
	params: { status?: SupportTicketStatus; adminReply?: string }
): Promise<SupportMessage> {
	const { tables } = adminServices();
	const now = new Date().toISOString();
	try {
		const updateData: Record<string, any> = { updated_at: now };
		if (params.status) updateData.status = params.status;
		if (typeof params.adminReply === 'string') updateData.admin_reply = params.adminReply.trim();

		const updated = await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: 'support_messages',
			rowId: ticketId,
			data: updateData
		});
		return mapSupportMessage(updated);
	} catch (error) {
		console.error('[Admin Support Message Update Error]:', error);
		throw new SupportServerError('Impossible de mettre à jour le ticket de support.', 500);
	}
}

/**
 * Purge support messages older than `days` days.
 * Optionally filter by status. Returns count of deleted rows.
 */
export async function purgeOldSupportMessagesServer(
	days: number = 30,
	statusFilter?: SupportTicketStatus | 'all'
): Promise<{ deleted: number }> {
	const { tables } = adminServices();
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	const cutoffIso = cutoff.toISOString();

	const queries = [Query.lessThan('created_at', cutoffIso), Query.limit(100)];
	if (statusFilter && statusFilter !== 'all') {
		queries.push(Query.equal('status', statusFilter));
	}

	let deleted = 0;
	try {
		const res = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'support_messages',
			queries
		});

		await Promise.all(
			res.rows.map((row: any) =>
				tables.deleteRow({
					databaseId: DATABASE_ID,
					tableId: 'support_messages',
					rowId: row.$id
				}).then(() => { deleted++; }).catch(() => {})
			)
		);
	} catch (error) {
		console.error('[Purge Support Messages Error]:', error);
		throw new SupportServerError('Erreur lors de la purge des tickets.', 500);
	}

	return { deleted };
}
