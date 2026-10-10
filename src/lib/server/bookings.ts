import { ID, Query, type Models } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { generateDynamicSlots } from '$lib/coaching/availability';
import { DEFAULT_SETTINGS, mapServiceDoc, mapSettingsDoc } from '$lib/services/coaching';
import { sendPurchaseNotifications } from '$lib/server/purchase-notifications';
import { resolveCoachingWhatsapp } from '$lib/server/coaching-contact';

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

async function withRateLimitRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 350): Promise<T> {
	let attempt = 0;
	while (attempt <= maxRetries) {
		try {
			return await fn();
		} catch (error: any) {
			if (error?.code === 429 && attempt < maxRetries) {
				attempt++;
				await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
				continue;
			}
			throw error;
		}
	}
	return await fn();
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

	// Fetch service details & slot availability concurrently outside of transaction lock to prevent Appwrite rate limit & transaction bottlenecks
	const [serviceRes, settingsPage, unavailablePage, bookingPage] = await withRateLimitRetry(() =>
		Promise.all([
			tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.services, rowId: serviceId }),
			tables.listRows({ databaseId: DATABASE_ID, tableId: TABLES.settings, queries: [Query.limit(1)] }),
			tables.listRows({
				databaseId: DATABASE_ID,
				tableId: TABLES.unavailability,
				queries: [Query.equal('service_id', serviceId), Query.lessThan('start_at', endAt), Query.greaterThan('end_at', startAt), Query.limit(100)]
			}),
			tables.listRows({
				databaseId: DATABASE_ID,
				tableId: TABLES.bookings,
				queries: [Query.equal('service_id', serviceId), Query.lessThan('start_at', endAt), Query.greaterThan('end_at', startAt), Query.limit(100)]
			})
		])
	).catch((error: any) => {
		if (error?.code === 429) {
			throw new BookingServerError('Trop de requêtes simultanées. Veuillez réessayer dans quelques secondes.', 429);
		}
		throw error;
	});

	const service: any = serviceRes;
	if (!service || !service.active) throw new BookingServerError('Cette offre de coaching n’est plus disponible.', 409);

	const settings = settingsPage.rows[0] ? mapSettingsDoc(settingsPage.rows[0]) : DEFAULT_SETTINGS;
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

	const transaction = await withRateLimitRetry(() => tables.createTransaction({ ttl: 60 })).catch((error: any) => {
		if (error?.code === 429) {
			throw new BookingServerError('Le serveur de réservation est très sollicité. Veuillez réessayer dans un instant.', 429);
		}
		throw error;
	});

	try {
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

		let freeOrderId: string | undefined;
		if (isFree) {
			freeOrderId = ID.unique();
			await tables.createRow({
				databaseId: DATABASE_ID, tableId: TABLES.orders, rowId: freeOrderId, transactionId: transaction.$id,
				data: {
					user_id: user.$id, customer_name: customerName, customer_email: user.email, customer_phone: customerWhatsapp,
					product_type: 'coaching', product_id: bookingId, product_title: String(service.title || 'Coaching'), amount: 0,
					currency: 'HTG', payment_provider: 'free', status: 'paid', created_at: now.toISOString(), paid_at: now.toISOString()
				}
			});
		}

		await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
		if (isFree && freeOrderId) {
			await sendPurchaseNotifications({
				id: freeOrderId, userId: user.$id, customerName, customerEmail: user.email,
				customerPhone: customerWhatsapp, productType: 'coaching', productId: bookingId,
				productTitle: String(service.title || 'Coaching'), amount: 0, currency: 'HTG',
				paymentProvider: 'free', status: 'paid', createdAt: now.toISOString(), paidAt: now.toISOString()
			}).catch((error) => console.error('[Booking notifications]', error));
		}
		return { bookingId, status: isFree ? 'confirmed' as const : 'pending_payment' as const, holdExpiresAt, amount, currency: 'HTG' as const };
	} catch (error: any) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		if (error instanceof BookingServerError) throw error;
		if (error?.code === 409) throw new BookingServerError('Ce créneau vient d’être réservé par une autre personne.', 409);
		if (error?.code === 429) throw new BookingServerError('Trop de requêtes simultanées. Veuillez réessayer dans quelques secondes.', 429);
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
		supportWhatsapp: resolveCoachingWhatsapp(settings.rows[0]?.whatsapp)
	};
}
