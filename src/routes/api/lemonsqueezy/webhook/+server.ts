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
		const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
		const signature = Buffer.from(signatureHeader, 'utf8');
		return crypto.timingSafeEqual(digest, signature);
	} catch {
		return false;
	}
}

/**
 * Valide une commande Lemon Squeezy et accorde l'accès dans Appwrite.
 */
async function fulfillOrder(orderId: string, customData?: Record<string, any>, lqOrderId?: string) {
	const { tables } = adminServices();
	const paidAt = new Date().toISOString();

	let orderRow: any;
	try {
		orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId });
	} catch {
		console.warn('[Lemon Squeezy Webhook]: Order introuvable dans Appwrite par ID:', orderId);
		return false;
	}

	if (orderRow.status === 'paid') {
		console.log('[Lemon Squeezy Webhook]: Commande déjà payée:', orderId);
		return true;
	}

	const userId = orderRow.user_id || customData?.user_id;
	const productType = orderRow.product_type || customData?.product_type;
	const productId = orderRow.product_id || customData?.product_id;

	const transaction = await tables.createTransaction({ ttl: 60 });
	try {
		// Accès Cours / Ebook
		if ((productType === 'course' || productType === 'ebook') && userId && productId) {
			const existing = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: ACCESS_TABLE,
				transactionId: transaction.$id,
				queries: [
					Query.equal('user_id', userId),
					Query.equal('item_type', productType),
					Query.equal('item_id', productId),
					Query.limit(1)
				]
			});

			if (!existing.rows.length) {
				await tables.createRow({
					databaseId: DATABASE_ID,
					tableId: ACCESS_TABLE,
					rowId: ID.unique(),
					transactionId: transaction.$id,
					data: {
						user_id: userId,
						item_type: productType,
						item_id: productId,
						granted_by: 'lemonsqueezy_webhook',
						created_at: paidAt
					}
				});
			}
		} else if (productType === 'coaching' && productId) {
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
			rowId: orderId,
			transactionId: transaction.$id,
			data: {
				status: 'paid',
				payment_id: lqOrderId || undefined,
				paid_at: paidAt
			}
		});

		await tables.updateTransaction({ transactionId: transaction.$id, commit: true });

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
			console.warn('[Lemon Squeezy Webhook]: Signature HMAC invalide.');
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

		console.log(`[Lemon Squeezy Webhook Reçu]: Événement="${eventName}", OrderID="${orderId}", Status="${status}"`);

		if (
			eventName === 'order_created' ||
			eventName === 'subscription_created' ||
			eventName === 'order_paid' ||
			status === 'paid'
		) {
			if (orderId) {
				await fulfillOrder(orderId, customData, lqOrderId);
				return json({ success: true, message: 'Commande validée et accès accordé.' });
			}
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
