import { json, type RequestHandler } from '@sveltejs/kit';
import { isPurchaseMaintenanceEnabled, MAINTENANCE_MESSAGE } from '$lib/server/maintenance';

export const GET: RequestHandler = async () => {
	try {
		return json(
			{ enabled: await isPurchaseMaintenanceEnabled(), message: MAINTENANCE_MESSAGE },
			{ headers: { 'cache-control': 'no-store' } }
		);
	} catch (error) {
		console.error('[Maintenance API]', error);
		return json({ enabled: false, message: MAINTENANCE_MESSAGE }, { headers: { 'cache-control': 'no-store' } });
	}
};
