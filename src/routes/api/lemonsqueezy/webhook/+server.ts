import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { sendPurchaseConfirmationEmail } from '$lib/server/purchase-email';
import { ID, Query } from 'node-appwrite';
import crypto from 'node:crypto';

const ORDERS_TABLE = 'orders';
const ACCESS_TABLE = 'access_grants';
const BOOKINGS_TABLE = 'bookings';

/**
 * Vérifie la signature HMAC SHA256 envoyée par Lemon Squeezy via l'en-tête X-Signature.
 */
function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
	if (!signatureHeader || !secret) return false;
	try {
		const hmac = crypto.createHmac('sha256', secret);
		const digestHex = hmac.update(rawBody).digest('hex');
		const digest = Buffer.from(digestHex, 'utf8');
		const signature = Buffer.from(signatureHeader, 'utf8');
		if (digest.length !== signature.length) return false;
		return crypto.timingSafeEqual(digest, signature);
	} catch {
		return false;
	}
}

/**
 * Valide une commande Lemon Squeezy et accorde l'accès dans Appwrite.
 */
async function fulfillOrder(orderId?: string, customData?: Record<string, any>, lqOrderId?: string) {
	const { tables } = adminServices();
	const paidAt = new Date().toISOString();

	let orderRow: any = null;

	// 1. Recherche par rowId (Appwrite order_id)
	if (orderId) {
		try {
			orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId });
		} catch {
			// handled in fallbacks below
		}
	}

	// 2. Fallback: Recherche par payment_id (Identifiant Lemon Squeezy)
	if (!orderRow) {
		try {
			const queries = [];
			if (orderId) queries.push(Query.equal('payment_id', orderId));
			if (lqOrderId) queries.push(Query.equal('payment_id', lqOrderId));
			if (queries.length) {
				const listByPayment = await tables.listRows({
					databaseId: DATABASE_ID,
					tableId: ORDERS_TABLE,
					queries: [Query.or(queries), Query.limit(1)]
				});
				if (listByPayment.rows.length) {
					orderRow = listByPayment.rows[0];
				}
			}
		} catch (e) {
			console.warn('[Lemon Squeezy Webhook]: Recherche par payment_id echouee:', e);
		}
	}

	// 3. Fallback: Recherche par user_id + product_id + status pending
	if (!orderRow && customData?.user_id && customData?.product_id) {
		try {
			const listByUserProduct = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: ORDERS_TABLE,
				queries: [
					Query.equal('user_id', customData.user_id),
					Query.equal('product_id', customData.product_id),
					Query.equal('status', 'pending'),
					Query.orderDesc('created_at'),
					Query.limit(1)
				]
			});
			if (listByUserProduct.rows.length) {
				orderRow = listByUserProduct.rows[0];
			}
		} catch (e) {
			console.warn('[Lemon Squeezy Webhook]: Recherche par user/product echouee:', e);
		}
	}

	if (!orderRow) {
		console.warn('[Lemon Squeezy Webhook]: Impossible de trouver la commande dans Appwrite.', {
			orderId,
			lqOrderId,
			customData
		});
		return false;
	}

	const targetOrderId = orderRow.$id;
	let userId = (orderRow.user_id && orderRow.user_id !== 'admin') ? orderRow.user_id : (customData?.user_id && customData.user_id !== 'admin' ? customData.user_id : undefined);
	if (!userId && orderRow.customer_email) {
		const { users } = adminServices();
		try {
			const uList = await users.list([Query.equal('email', orderRow.customer_email.trim().toLowerCase()), Query.limit(1)]);
			if (uList.users.length > 0) userId = uList.users[0].$id;
		} catch {}
	}
	if (!userId) userId = orderRow.user_id || customData?.user_id;

	const productType = orderRow.product_type || customData?.product_type;
	const productId = orderRow.product_id || customData?.product_id;

	// TOUJOURS créer l'accès dans access_grants
	if ((productType === 'course' || productType === 'ebook') && userId && productId) {
		const existing = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: ACCESS_TABLE,
			queries: [
				Query.equal('user_id', userId),
				Query.equal('item_type', productType),
				Query.equal('item_id', productId),
				Query.limit(1)
			]
		}).catch(() => ({ rows: [] }));

		if (!existing.rows.length) {
			await tables.createRow({
				databaseId: DATABASE_ID,
				tableId: ACCESS_TABLE,
				rowId: ID.unique(),
				data: {
					user_id: userId,
					item_type: productType,
					item_id: productId,
					granted_by: 'purchase',
					created_at: paidAt
				}
			}).catch((e) => console.error('[Access grant error in webhook fulfillOrder]:', e));
		}
	}

	if (orderRow.status === 'paid') {
		if (userId && (!orderRow.user_id || orderRow.user_id === 'admin')) {
			await tables.updateRow({
				databaseId: DATABASE_ID,
				tableId: ORDERS_TABLE,
				rowId: targetOrderId,
				data: { user_id: userId }
			}).catch(() => undefined);
		}
		console.log('[Lemon Squeezy Webhook]: Commande déjà marquée payée et accès garanti:', targetOrderId);
		return true;
	}

	const transaction = await tables.createTransaction({ ttl: 60 });
	try {
		if (productType === 'coaching' && productId) {
			// Confirmation Coaching
			const booking: any = await tables.getRow({
				databaseId: DATABASE_ID,
				tableId: BOOKINGS_TABLE,
				rowId: productId,
				transactionId: transaction.$id
			}).catch(() => null);

			if (booking) {
				await tables.updateRow({
					databaseId: DATABASE_ID,
					tableId: BOOKINGS_TABLE,
					rowId: booking.$id,
					transactionId: transaction.$id,
					data: {
						status: 'confirmed',
						payment_status: 'paid',
						payment_id: lqOrderId || undefined,
						updated_at: paidAt
					}
				});
			}
		}

		// Mettre à jour la commande principale
		orderRow = await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: ORDERS_TABLE,
			rowId: targetOrderId,
			transactionId: transaction.$id,
			data: {
				status: 'paid',
				user_id: userId || orderRow.user_id,
				payment_id: lqOrderId || undefined,
				paid_at: paidAt
			}
		});

		await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
		console.log('[Lemon Squeezy Webhook]: Accès accordé et commande validée avec succès:', targetOrderId);

		// Email de confirmation
		try {
			await sendPurchaseConfirmationEmail({
				id: orderRow.$id,
				userId: orderRow.user_id,
				customerName: orderRow.customer_name || 'Client',
				customerEmail: orderRow.customer_email || '',
				productType: orderRow.product_type,
				productId: orderRow.product_id,
				productTitle: orderRow.product_title || '',
				amount: orderRow.amount || 0,
				currency: 'USD',
				paymentProvider: 'lemonsqueezy',
				status: 'paid',
				createdAt: orderRow.created_at || paidAt,
				paidAt: paidAt
			});
		} catch (emailErr) {
			console.error('[Lemon Squeezy Webhook Email Error]:', emailErr);
		}

		return true;
	} catch (err) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		console.error('[Lemon Squeezy Webhook Fulfill Error]:', err);
		throw err;
	}
}

/**
 * Handler POST pour recevoir les webhooks envoyés par Lemon Squeezy
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const signature = request.headers.get('x-signature');
		const webhookSecret = (env.LEMONSQUEEZY_WEBHOOK_SECRET || env.LEMONSQUEEZY_SIGNING_SECRET || '').trim();

		if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
			console.warn('[Lemon Squeezy Webhook]: Signature HMAC invalide. Vérifiez LEMONSQUEEZY_WEBHOOK_SECRET.');
			return json({ success: false, message: 'Signature Webhook invalide.' }, { status: 401 });
		}

		let payload: any = {};
		try {
			payload = JSON.parse(rawBody);
		} catch {
			return json({ success: false, message: 'Payload JSON invalide.' }, { status: 400 });
		}

		const eventName = payload?.meta?.event_name || payload?.event_name;
		const customData = payload?.meta?.custom_data || payload?.custom_data || {};
		const orderId = customData?.order_id || payload?.data?.attributes?.order_number;
		const lqOrderId = String(payload?.data?.id || payload?.id || '');
		const status = payload?.data?.attributes?.status || 'paid';

		console.log(`[Lemon Squeezy Webhook Reçu]: Événement="${eventName}", OrderID="${orderId}", LQ_ID="${lqOrderId}", Status="${status}"`);

		if (
			eventName === 'order_created' ||
			eventName === 'subscription_created' ||
			eventName === 'order_paid' ||
			status === 'paid'
		) {
			const fulfilled = await fulfillOrder(orderId, customData, lqOrderId);
			if (fulfilled) {
				return json({ success: true, message: 'Commande validée et accès accordé.' });
			}
			return json({ success: true, message: 'Webhook reçu, mais commande non trouvée dans la base.' });
		}

		return json({ success: true, message: `Événement "${eventName}" bien reçu.` });
	} catch (err: any) {
		console.error('[Lemon Squeezy Webhook Error]:', err?.message || err);
		return json(
			{ success: false, message: err?.message || 'Erreur lors du traitement du Webhook.' },
			{ status: 500 }
		);
	}
};
