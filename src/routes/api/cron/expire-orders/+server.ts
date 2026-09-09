import { json, type RequestHandler } from '@sveltejs/kit';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { Query } from 'node-appwrite';

const ORDERS_TABLE = 'orders';
const BOOKINGS_TABLE = 'bookings';

/**
 * Route GET / POST pour le Cron d'expiration des commandes en attente :
 * - Lemon Squeezy : expire après 30 minutes.
 * - MonCash / NatCash / Autre : expire après 15 minutes.
 */
async function processExpiredOrders() {
	const { tables } = adminServices();
	const now = Date.now();
	let expiredOrdersCount = 0;
	let expiredBookingsCount = 0;

	// 1. Récupérer les commandes en attente (Orders)
	try {
		const res = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: ORDERS_TABLE,
			queries: [Query.equal('status', 'pending'), Query.limit(100)]
		});
		const pendingOrders = res.rows || [];

		for (const order of pendingOrders) {
			const provider = String(order.payment_provider || '').toLowerCase();

			// Ne traiter que Lemon Squeezy (Plopplop / MonCash / NatCash est géré par la fonction Appwrite payment-maintenance)
			if (provider !== 'lemonsqueezy') continue;

			const createdAt = order.created_at || order.$createdAt;
			const createdTime = new Date(createdAt).getTime();

			if (Number.isNaN(createdTime)) continue;

			const ageMinutes = (now - createdTime) / (60 * 1000);
			const thresholdMinutes = 30;

			if (ageMinutes >= thresholdMinutes) {
				const transaction = await tables.createTransaction({ ttl: 60 });
				try {
					await tables.updateRow({
						databaseId: DATABASE_ID,
						tableId: ORDERS_TABLE,
						rowId: order.$id,
						transactionId: transaction.$id,
						data: { status: 'expired' }
					});

					if (order.product_type === 'coaching' && order.product_id) {
						const booking: any = await tables.getRow({
							databaseId: DATABASE_ID,
							tableId: BOOKINGS_TABLE,
							rowId: order.product_id,
							transactionId: transaction.$id
						}).catch(() => null);

						if (booking && booking.status === 'pending_payment') {
							await tables.updateRow({
								databaseId: DATABASE_ID,
								tableId: BOOKINGS_TABLE,
								rowId: booking.$id,
								transactionId: transaction.$id,
								data: {
									status: 'cancelled',
									payment_status: 'expired',
									hold_expires_at: null,
									updated_at: new Date().toISOString()
								}
							});
						}
					}

					await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
					expiredOrdersCount++;
					console.log(`[Cron Expire Orders]: Commande ${order.$id} (${provider}) expirée après ${Math.round(ageMinutes)} min.`);
				} catch (err) {
					await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
					console.error(`[Cron Expire Orders Error]: Échec expiration commande ${order.$id}:`, err);
				}
			}
		}
	} catch (err) {
		console.error('[Cron Expire Orders]: Erreur lecture des commandes:', err);
	}

	// 2. Récupérer et expirer les réservations en attente (Bookings) directement (abandonnées ou >60min)
	try {
		const res = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: BOOKINGS_TABLE,
			queries: [Query.equal('status', 'pending_payment'), Query.limit(100)]
		});
		const pendingBookings = res.rows || [];

		for (const booking of pendingBookings) {
			const holdTime = booking.hold_expires_at ? new Date(booking.hold_expires_at).getTime() : NaN;
			const startTime = booking.start_at ? new Date(booking.start_at).getTime() : NaN;
			const createdTime = new Date(booking.created_at || booking.$createdAt).getTime();

			const isHoldExpired = Number.isFinite(holdTime) && holdTime <= now;
			const isStartPassed = Number.isFinite(startTime) && startTime <= now;
			const isAgeExpired = Number.isFinite(createdTime) && (now - createdTime) >= 60 * 60 * 1000;

			if (isHoldExpired || isStartPassed || isAgeExpired || !booking.hold_expires_at) {
				const transaction = await tables.createTransaction({ ttl: 60 });
				try {
					await tables.updateRow({
						databaseId: DATABASE_ID,
						tableId: BOOKINGS_TABLE,
						rowId: booking.$id,
						transactionId: transaction.$id,
						data: {
							status: 'cancelled',
							payment_status: 'expired',
							hold_expires_at: null,
							updated_at: new Date().toISOString()
						}
					});

					await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
					expiredBookingsCount++;
					console.log(`[Cron Expire Bookings]: Réservation ${booking.$id} expirée et créneau libéré.`);
				} catch (err) {
					await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
					console.error(`[Cron Expire Bookings Error]: Échec annulation réservation ${booking.$id}:`, err);
				}
			}
		}
	} catch (err) {
		console.error('[Cron Expire Bookings]: Erreur lecture des réservations:', err);
	}

	return { success: true, expiredOrdersCount, expiredBookingsCount, expiredCount: expiredOrdersCount + expiredBookingsCount };
}

export const GET: RequestHandler = async () => {
	const result = await processExpiredOrders();
	return json(result);
};

export const POST: RequestHandler = async () => {
	const result = await processExpiredOrders();
	return json(result);
};
