import { json } from '@sveltejs/kit';
import { Query } from 'node-appwrite';
import type { RequestHandler } from './$types';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { generateDynamicSlots } from '$lib/coaching/availability';
import { mapServiceDoc, mapSettingsDoc, DEFAULT_SETTINGS } from '$lib/services/coaching';

export const GET: RequestHandler = async ({ params, url }) => {
	const { tables } = adminServices();
	const service: any = await tables.getRow({
		databaseId: DATABASE_ID, tableId: 'coaching_services', rowId: params.serviceId
	}).catch(() => null);
	if (!service || !service.active) return json({ message: 'Cette offre de coaching est indisponible.' }, { status: 404 });

	const settingsPage = await tables.listRows({
		databaseId: DATABASE_ID, tableId: 'coaching_settings', queries: [Query.limit(1)]
	}).catch(() => ({ rows: [] }));
	const settings = settingsPage.rows[0] ? mapSettingsDoc(settingsPage.rows[0]) : DEFAULT_SETTINGS;
	const days = Math.max(1, Math.min(Number(url.searchParams.get('days')) || 30, settings.maxAdvanceDays));
	const until = new Date(Date.now() + (days + 1) * 86_400_000).toISOString();

	const [bookingPage, unavailablePage] = await Promise.all([
		tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'bookings',
			queries: [
				Query.equal('service_id', service.$id),
				Query.greaterThan('end_at', new Date().toISOString()),
				Query.lessThan('start_at', until),
				Query.limit(500)
			]
		}),
		tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'coaching_unavailability',
			queries: [
				Query.equal('service_id', service.$id),
				Query.greaterThan('end_at', new Date().toISOString()),
				Query.lessThan('start_at', until),
				Query.limit(500)
			]
		})
	]);

	const slots = generateDynamicSlots(
		mapServiceDoc(service),
		settings,
		bookingPage.rows.map((booking: any) => ({
			startAt: booking.start_at, endAt: booking.end_at, status: booking.status, holdExpiresAt: booking.hold_expires_at
		})),
		unavailablePage.rows.map((item: any) => ({
			id: item.$id, serviceId: item.service_id || null, startAt: item.start_at, endAt: item.end_at, reason: item.reason || ''
		})),
		{ days }
	);
	return json({ slots }, { headers: { 'cache-control': 'no-store' } });
};
