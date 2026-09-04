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

	// Récupérer les commandes en attente
	let pendingOrders: any[] = [];
	try {
		const res = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: ORDERS_TABLE,
			queries: [Query.equal('status', 'pending'), Query.limit(100)]
		});
		pendingOrders = res.rows || [];
	} catch (err) {
		console.error('[Cron Expire Orders]: Erreur lecture des commandes:', err);
		return { success: false, expiredCount: 0 };
	}

	let expiredCount = 0;

	for (const order of pendingOrders) {
		const createdAt = order.created_at || order.$createdAt;
		const createdTime = new Date(createdAt).getTime();

		if (Number.isNaN(createdTime)) continue;

		const ageMinutes = (now - createdTime) / (60 * 1000);
		const provider = String(order.payment_provider || '').toLowerCase();

		// Seuil d'expiration : 30 min pour Lemon Squeezy, 15 min pour Plopplop / autres
		const thresholdMinutes = provider === 'lemonsqueezy' ? 30 : 15;

		if (ageMinutes >= thresholdMinutes) {
			const transaction = await tables.createTransaction({ ttl: 60 });
			try {
				// Mettre la commande en 'expired'
				await tables.updateRow({
					databaseId: DATABASE_ID,
					tableId: ORDERS_TABLE,
					rowId: order.$id,
					transactionId: transaction.$id,
					data: {
						status: 'expired'
					}
				});

				// Si c'est un coaching, annuler la réservation
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
								updated_at: new Date().toISOString()
							}
						});
					}
				}

				await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
				expiredCount++;
				console.log(`[Cron Expire Orders]: Commande ${order.$id} (${provider}) expirée après ${Math.round(ageMinutes)} min.`);
			} catch (err) {
				await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
				console.error(`[Cron Expire Orders Error]: Échec expiration commande ${order.$id}:`, err);
			}
		}
	}

	return { success: true, expiredCount };
}

export const GET: RequestHandler = async () => {
	const result = await processExpiredOrders();
	return json(result);
};

export const POST: RequestHandler = async () => {
	const result = await processExpiredOrders();
	return json(result);
};
