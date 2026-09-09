import { ID, Query, type Models } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { generateDynamicSlots } from '$lib/coaching/availability';
import { DEFAULT_SETTINGS, mapServiceDoc, mapSettingsDoc } from '$lib/services/coaching';

const HOLD_MINUTES = 60;
const TABLES = { services: 'coaching_services', bookings: 'bookings', orders: 'orders', settings: 'coaching_settings', unavailability: 'coaching_unavailability' };

export class BookingServerError extends Error {
	constructor(message: string, public status = 500) {
		super(message);
		this.name = 'BookingServerError';
	}
}

function validPhone(value: unknown): boolean {
	return /^\+[1-9]\d{7,14}$/.test(String(value || '').trim());
}

function validTimezone(value: unknown): boolean {
	try {
		new Intl.DateTimeFormat('fr', { timeZone: String(value || '') }).format();
		return true;
	} catch {
		return false;
	}
}

export function mapBooking(row: any) {
	return {
		id: row.$id, serviceId: row.service_id || '', userId: row.user_id || null,
		customerName: row.customer_name || '', customerEmail: row.customer_email || '', customerWhatsapp: row.customer_whatsapp || '',
		customerTimezone: row.customer_timezone || 'America/Port-au-Prince', coachTimezone: row.coach_timezone || 'America/Port-au-Prince',
		startAt: row.start_at || '', endAt: row.end_at || '', amount: Number(row.amount) || 0, currency: 'HTG' as const,
		status: row.status, paymentId: row.payment_id || null, paymentStatus: row.payment_status || 'pending',
		holdExpiresAt: row.hold_expires_at || null, createdAt: row.created_at || row.$createdAt, updatedAt: row.updated_at || row.$updatedAt
	};
}

export async function createBookingServer(body: any, user: Models.User<Models.Preferences>) {
	const serviceId = typeof body?.serviceId === 'string' ? body.serviceId.trim() : '';
	const startAt = typeof body?.startAt === 'string' ? body.startAt.trim() : '';
	const endAt = typeof body?.endAt === 'string' ? body.endAt.trim() : '';
	const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : '';
	const customerWhatsapp = typeof body?.customerWhatsapp === 'string' ? body.customerWhatsapp.trim() : '';
	const customerTimezone = typeof body?.customerTimezone === 'string' ? body.customerTimezone.trim() : '';
	const startTime = Date.parse(startAt);
	const endTime = Date.parse(endAt);
	if (!serviceId || !Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime ||
		customerName.length < 2 || customerName.length > 160 || !validPhone(customerWhatsapp) || !validTimezone(customerTimezone)) {
		throw new BookingServerError('Informations de réservation invalides.', 400);
	}

	const { tables } = adminServices();
	const transaction = await tables.createTransaction({ ttl: 60 });
	try {
		const service: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.services, rowId: serviceId, transactionId: transaction.$id });
		if (!service.active) throw new BookingServerError('Cette offre de coaching n’est plus disponible.', 409);
		const settingsPage = await tables.listRows({
			databaseId: DATABASE_ID, tableId: TABLES.settings, transactionId: transaction.$id, queries: [Query.limit(1)]
		});
		const settings = settingsPage.rows[0] ? mapSettingsDoc(settingsPage.rows[0]) : DEFAULT_SETTINGS;
		const unavailablePage = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: TABLES.unavailability,
			transactionId: transaction.$id,
			queries: [Query.equal('service_id', serviceId), Query.lessThan('start_at', endAt), Query.greaterThan('end_at', startAt), Query.limit(100)]
		});
		const bookingPage = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: TABLES.bookings,
			transactionId: transaction.$id,
			queries: [Query.equal('service_id', serviceId), Query.lessThan('start_at', endAt), Query.greaterThan('end_at', startAt), Query.limit(100)]
		});
		const now = new Date();
		const bookings = bookingPage.rows.map((booking: any) => ({
			startAt: booking.start_at, endAt: booking.end_at, status: booking.status, holdExpiresAt: booking.hold_expires_at
		}));
		const requestedDays = Math.max(1, Math.ceil((startTime - now.getTime()) / 86_400_000) + 1);
		const validSlot = generateDynamicSlots(
			mapServiceDoc(service), settings, bookings,
			unavailablePage.rows.map((item: any) => ({
				id: item.$id, serviceId: item.service_id || null, startAt: item.start_at, endAt: item.end_at, reason: item.reason || ''
			})),
			{ now, days: requestedDays }
		).some((slot) => slot.startAt === new Date(startTime).toISOString() && slot.endAt === new Date(endTime).toISOString());
		if (!validSlot) throw new BookingServerError('Ce créneau n’est plus disponible.', 409);

		const isFree = Boolean(service.is_free) || Number(service.price) <= 0;
		const amount = isFree ? 0 : Number(service.price);
		if (!Number.isFinite(amount) || amount < 0) throw new BookingServerError('Le tarif du coaching est invalide.', 409);
		const bookingId = ID.unique();
		const holdExpiresAt = isFree ? null : new Date(now.getTime() + HOLD_MINUTES * 60_000).toISOString();
		const reservationKey = `${serviceId}:${new Date(startTime).toISOString()}`;

		await tables.createRow({
			databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: bookingId, transactionId: transaction.$id,
			data: {
				service_id: service.$id, reservation_key: reservationKey, user_id: user.$id,
				customer_name: customerName, customer_email: user.email, customer_whatsapp: customerWhatsapp,
				customer_timezone: customerTimezone, coach_timezone: settings.timezone,
				start_at: new Date(startTime).toISOString(), end_at: new Date(endTime).toISOString(), amount, currency: 'HTG',
				status: isFree ? 'confirmed' : 'pending_payment', payment_status: isFree ? 'not_required' : 'pending',
				hold_expires_at: holdExpiresAt || undefined, created_at: now.toISOString(), updated_at: now.toISOString()
			}
		});

		if (isFree) {
			await tables.createRow({
				databaseId: DATABASE_ID, tableId: TABLES.orders, rowId: ID.unique(), transactionId: transaction.$id,
				data: {
					user_id: user.$id, customer_name: customerName, customer_email: user.email, customer_phone: customerWhatsapp,
					product_type: 'coaching', product_id: bookingId, product_title: String(service.title || 'Coaching'), amount: 0,
					currency: 'HTG', payment_provider: 'free', status: 'paid', created_at: now.toISOString(), paid_at: now.toISOString()
				}
			});
		}

		await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
		return { bookingId, status: isFree ? 'confirmed' as const : 'pending_payment' as const, holdExpiresAt, amount, currency: 'HTG' as const };
	} catch (error) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		if (error instanceof BookingServerError) throw error;
		if ((error as any)?.code === 409) throw new BookingServerError('Ce créneau vient d’être réservé par une autre personne.', 409);
		throw error;
	}
}

export async function getOwnedBookingServer(bookingId: string, userId: string) {
	const { tables } = adminServices();
	let booking: any;
	try { booking = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: bookingId }); }
	catch { throw new BookingServerError('Réservation introuvable.', 404); }
	if (booking.user_id !== userId) throw new BookingServerError('Accès refusé à cette réservation.', 403);

	if (booking.status === 'pending_payment' || booking.payment_status === 'pending') {
		const paidOrders = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: TABLES.orders,
			queries: [
				Query.equal('product_type', 'coaching'),
				Query.equal('product_id', booking.$id),
				Query.equal('status', 'paid'),
				Query.limit(1)
			]
		}).catch(() => ({ rows: [] }));

		if (paidOrders.rows.length > 0) {
			const paidAt = new Date().toISOString();
			await tables.updateRow({
				databaseId: DATABASE_ID,
				tableId: TABLES.bookings,
				rowId: booking.$id,
				data: { status: 'confirmed', payment_status: 'paid', hold_expires_at: null, updated_at: paidAt }
			}).catch(() => undefined);
			booking.status = 'confirmed';
			booking.payment_status = 'paid';

		}
	}

	const [service, settings] = await Promise.all([
		tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.services, rowId: booking.service_id }).catch(() => null),
		tables.listRows({ databaseId: DATABASE_ID, tableId: TABLES.settings, queries: [Query.limit(1)] }).catch(() => ({ rows: [] }))
	]);
	return {
		booking: mapBooking(booking),
		serviceTitle: service?.title || 'Coaching individuel',
		servicePrice: Number(service?.price) || 0,
		servicePriceUsd: Number(service?.price_usd || service?.priceUsd) || 0,
		serviceIsFree: Boolean(service?.is_free),
		supportWhatsapp: settings.rows[0]?.whatsapp || ''
	};
}
