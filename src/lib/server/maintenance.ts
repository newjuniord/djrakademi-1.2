import { dev } from '$app/environment';
import { adminServices, DATABASE_ID, SETTINGS_ROW_ID, SETTINGS_TABLE } from '$lib/server/admin-appwrite';

export function getMaintenanceMessage(lang: string = 'ht'): string {
	return lang === 'fr'
		? 'L\'application est actuellement en maintenance. Veuillez réessayer plus tard.'
		: 'Aplikasyon an, nan antretyen kounye a. Tanpri eseye ankò pita.';
}

export const MAINTENANCE_MESSAGE = getMaintenanceMessage('ht');

export async function isPurchaseMaintenanceEnabled(): Promise<boolean> {
	// Le mode maintenance ne s'active QUE sur la version de production (live) et JAMAIS en développement local (dev)
	if (dev) {
		return false;
	}

	const { tables } = adminServices();
	try {
		const settings: any = await tables.getRow({
			databaseId: DATABASE_ID,
			tableId: SETTINGS_TABLE,
			rowId: SETTINGS_ROW_ID
		});
		return Boolean(settings.maintenance_mode);
	} catch (error: any) {
		if (error?.code === 404) return false;
		throw error;
	}
}
