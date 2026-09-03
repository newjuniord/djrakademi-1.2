import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { requirePaymentUser } from '$lib/server/payments';
import { sendPurchaseConfirmationEmail } from '$lib/server/purchase-email';
import { ID, Query } from 'node-appwrite';
import crypto from 'node:crypto';

const ORDERS_TABLE = 'orders';
const ACCESS_TABLE = 'access_grants';
const BOOKINGS_TABLE = 'bookings';

/**
 * Vérifie la signature HMAC SHA256 envoyée par Lemon Squeezy.
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
 * Traite et valide une commande payée depuis Lemon Squeezy.
 */
async function fulfillOrder(orderId: string, customData?: Record<string, any>, lqOrderId?: string) {
	const { tables } = adminServices();
	const paidAt = new Date().toISOString();

	let orderRow: any;
	try {
		orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId });
	} catch {
		console.warn('[Lemon Squeezy Verify]: Order introuvable par rowId:', orderId);
		return false;
	}

	if (orderRow.status === 'paid') {
		return true; // Déjà confirmé
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
						granted_by: 'lemonsqueezy',
						created_at: paidAt
					}
				});
			}
		} else if (productType === 'coaching' && productId) {
			// Accès Coaching
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

		// Mettre à jour la commande
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

		// Envoi de l'email de confirmation de commande
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
				currency: orderRow.currency || 'USD',
				paymentProvider: 'lemonsqueezy',
				status: 'paid',
				createdAt: orderRow.created_at || paidAt,
				paidAt: paidAt
			});
		} catch (e) {
			console.error('[Lemon Squeezy Verify Email Error]:', e);
		}

		return true;
	} catch (err) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		console.error('[Lemon Squeezy Fulfill Error]:', err);
		throw err;
	}
}

/**
 * Interroge l'API Lemon Squeezy par email, extrait le variant_id et débloque le produit Appwrite correspondant.
 */
async function verifyAndFulfillByEmail(userEmail: string) {
	const apiKey = env.LEMONSQUEEZY_API_KEY?.trim();
	const storeId = env.LEMONSQUEEZY_STORE_ID?.trim();

	if (!apiKey) {
		throw new Error('LEMONSQUEEZY_API_KEY n’est pas configurée sur le serveur.');
	}

	const normalizedEmail = userEmail.trim().toLowerCase();

	// 1. Récupérer les commandes Lemon Squeezy pour cet email via leur REST API
	const lqUrl = `https://api.lemonsqueezy.com/v1/orders?filter[user_email]=${encodeURIComponent(normalizedEmail)}${storeId ? `&filter[store_id]=${storeId}` : ''}`;
	const lqRes = await fetch(lqUrl, {
		headers: {
			Accept: 'application/vnd.api+json',
			'Content-Type': 'application/vnd.api+json',
			Authorization: `Bearer ${apiKey}`
		}
	});

	if (!lqRes.ok) {
		const errText = await lqRes.text().catch(() => '');
		console.error('[Lemon Squeezy API Error]:', lqRes.status, errText);
		throw new Error('Erreur lors de la communication avec l’API Lemon Squeezy.');
	}

	const lqData = await lqRes.json().catch(() => ({}));
	const orders = Array.isArray(lqData?.data) ? lqData.data : [];

	if (orders.length === 0) {
		return {
			success: false,
			grantedProducts: [],
			message: `Nou pa jwenn okenn peman Lemon Squeezy pou imel "${normalizedEmail}".`
		};
	}

	// 2. Retrouver l'utilisateur Appwrite par son email
	const { tables, users } = adminServices();
	let userId: string | null = null;
	try {
		const userList = await users.list([Query.equal('email', normalizedEmail), Query.limit(1)]);
		if (userList.users.length > 0) {
			userId = userList.users[0].$id;
		}
	} catch (e) {
		console.warn('[Lemon Squeezy Verify]: Utilisateur introuvable dans Appwrite Users par email:', e);
	}

	// 3. Charger tous les cours, ebooks et services de coaching avec leur variant_id
	const [coursesRes, ebooksRes, coachingRes] = await Promise.all([
		tables.listRows({ databaseId: DATABASE_ID, tableId: 'courses', queries: [Query.limit(100)] }).catch(() => ({ rows: [] })),
		tables.listRows({ databaseId: DATABASE_ID, tableId: 'ebooks', queries: [Query.limit(100)] }).catch(() => ({ rows: [] })),
		tables.listRows({ databaseId: DATABASE_ID, tableId: 'coaching_services', queries: [Query.limit(100)] }).catch(() => ({ rows: [] }))
	]);

	const allProducts = [
		...coursesRes.rows.map((r: any) => ({
			id: r.$id,
			title: r.title || 'Cours',
			type: 'course' as const,
			variantId: String(r.lemonsqueezy_variant_id || r.variant_id || '').trim()
		})),
		...ebooksRes.rows.map((r: any) => ({
			id: r.$id,
			title: r.title || 'Ebook',
			type: 'ebook' as const,
			variantId: String(r.lemonsqueezy_variant_id || r.variant_id || '').trim()
		})),
		...coachingRes.rows.map((r: any) => ({
			id: r.$id,
			title: r.title || 'Coaching',
			type: 'coaching' as const,
			variantId: String(r.lemonsqueezy_variant_id || r.variant_id || '').trim()
		}))
	];

	const grantedProducts: string[] = [];
	const paidAt = new Date().toISOString();

	for (const order of orders) {
		const attributes = order.attributes || {};
		const status = String(attributes.status || '').toLowerCase();

		if (status !== 'paid') continue; // Seules les commandes confirmées

		const lqVariantId = String(
			attributes.first_order_item?.variant_id ||
			attributes.variant_id ||
			''
		).trim();

		const customData = attributes.custom_data || {};
		const metaProductId = customData.product_id;
		const metaProductType = customData.product_type;
		const metaUserId = customData.user_id || userId;

		// Matcher avec un produit Appwrite ayant le même Lemon Squeezy Variant ID
		let matchedProduct = allProducts.find(
			(p) => (lqVariantId && p.variantId === lqVariantId) || (metaProductId && p.id === metaProductId)
		);

		if (!matchedProduct && metaProductId) {
			matchedProduct = {
				id: metaProductId,
				title: attributes.first_order_item?.product_name || 'Produit DJR Akademi',
				type: (metaProductType as any) || 'course',
				variantId: lqVariantId
			};
		}

		if (!matchedProduct) {
			console.warn('[Lemon Squeezy Verify]: Aucun produit Appwrite ne matche avec le Variant ID:', lqVariantId);
			continue;
		}

		const targetUserId = metaUserId || userId;

		if (targetUserId) {
			// Créer l'accès dans access_grants
			const existingAccess = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: ACCESS_TABLE,
				queries: [
					Query.equal('user_id', targetUserId),
					Query.equal('item_type', matchedProduct.type),
					Query.equal('item_id', matchedProduct.id),
					Query.limit(1)
				]
			}).catch(() => ({ rows: [] }));

			if (!existingAccess.rows.length) {
				await tables.createRow({
					databaseId: DATABASE_ID,
					tableId: ACCESS_TABLE,
					rowId: ID.unique(),
					data: {
						user_id: targetUserId,
						item_type: matchedProduct.type,
						item_id: matchedProduct.id,
						granted_by: 'lemonsqueezy_email_verify',
						created_at: paidAt
					}
				}).catch((e) => console.error('[Access grant error]:', e));
			}

			if (!grantedProducts.includes(matchedProduct.title)) {
				grantedProducts.push(matchedProduct.title);
			}
		}
	}

	return {
		success: grantedProducts.length > 0,
		grantedProducts,
		message: grantedProducts.length > 0
			? `Aksè dousman epi avèk siksè debloke pou : ${grantedProducts.join(', ')}.`
			: `Peman pa kat la jwenn men okenn Variant ID pa matche ak yon pwodui Appwrite.`
	};
}

/**
 * Endpoint POST : Webhook Lemon Squeezy OU Vérification par email
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const signature = request.headers.get('x-signature');
		const webhookSecret = env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();

		// Si un secret est configuré et une signature est présente -> vérification webhook
		if (signature && webhookSecret) {
			const isValid = verifySignature(rawBody, signature, webhookSecret);
			if (!isValid) {
				console.warn('[Lemon Squeezy Verify]: Signature invalide.');
				return json({ success: false, message: 'Signature Webhook invalide.' }, { status: 401 });
			}
		}

		let payload: any = {};
		try {
			payload = JSON.parse(rawBody);
		} catch {
			return json({ success: false, message: 'Payload JSON invalide.' }, { status: 400 });
		}

		// CAS 1 : Vérification par Email depuis le formulaire du site (nécessite connexion)
		if (typeof payload?.email === 'string' && payload.email.trim()) {
			const user = await requirePaymentUser(request).catch(() => null);
			if (!user) {
				return json(
					{ success: false, message: 'Ou dwe konekte sou kont ou pou w ka verifye yon peman.' },
					{ status: 401 }
				);
			}
			const result = await verifyAndFulfillByEmail(payload.email);
			return json(result, { status: result.success ? 200 : 404 });
		}

		// CAS 2 : Webhook Lemon Squeezy (order_created, subscription_created)
		const eventName = payload?.meta?.event_name || payload?.event_name;
		const customData = payload?.meta?.custom_data || payload?.custom_data || {};
		const orderId = customData?.order_id || payload?.order_id;
		const lqOrderId = String(payload?.data?.id || payload?.id || '');

		console.log(`[Lemon Squeezy Webhook Received]: Événement: "${eventName}", Order ID: "${orderId}"`);

		if (eventName === 'order_created' || eventName === 'subscription_created' || payload?.status === 'paid') {
			if (!orderId) {
				return json({ success: false, message: 'ID de commande manquant dans custom_data.' }, { status: 400 });
			}

			await fulfillOrder(orderId, customData, lqOrderId);
			return json({ success: true, message: 'Commande vérifiée et validée avec succès.' });
		}

		return json({ success: true, message: `Événement "${eventName}" reçu.` });
	} catch (error) {
		console.error('[API Lemon Squeezy Verify Error]:', error instanceof Error ? error.message : error);
		return json(
			{ success: false, message: error instanceof Error ? error.message : 'Erreur lors de la vérification.' },
			{ status: 500 }
		);
	}
};

/**
 * Endpoint GET : Vérification du statut d'une commande par Order ID
 */
export const GET: RequestHandler = async ({ url }) => {
	const orderId = url.searchParams.get('order_id');
	if (!orderId) {
		return json({ success: false, message: 'order_id est requis.' }, { status: 400 });
	}

	try {
		const { tables } = adminServices();
		const orderRow: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId });

		return json({
			success: true,
			order: {
				id: orderRow.$id,
				status: orderRow.status,
				productType: orderRow.product_type,
				productId: orderRow.product_id,
				amount: orderRow.amount,
				paidAt: orderRow.paid_at
			}
		});
	} catch {
		return json({ success: false, message: 'Commande introuvable.' }, { status: 404 });
	}
};
