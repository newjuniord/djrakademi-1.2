import { env } from '$env/dynamic/private';
import { Query } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { normalizeWhatsappNumber } from '$lib/server/whatsapp/client';

export function resolveCoachingWhatsapp(coachNumber: unknown): string {
	const coach = normalizeWhatsappNumber(String(coachNumber || ''));
	const backup = normalizeWhatsappNumber(env.WHATSAPP_BACKUP_NUMBER || '');
	const number = coach || backup;
	return number ? `+${number}` : '';
}

export async function getCoachingWhatsapp(): Promise<string> {
	try {
		const { tables } = adminServices();
		const settings = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'coaching_settings',
			queries: [Query.limit(1)]
		});
		return resolveCoachingWhatsapp(settings.rows[0]?.whatsapp);
	} catch (error) {
		console.error('[Coaching contact] Paramètres indisponibles :', error);
		return resolveCoachingWhatsapp(undefined);
	}
}
