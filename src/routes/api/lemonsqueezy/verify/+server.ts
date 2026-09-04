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
 * Traite et valide une commande payée depuis Lemon Squeezy.
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

	// 2. Fallback: Recherche par payment_id
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
			console.warn('[Lemon Squeezy Verify]: Recherche par payment_id echouee:', e);
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
			console.warn('[Lemon Squeezy Verify]: Recherche par user/product echouee:', e);
		}
	}

	if (!orderRow) {
		console.warn('[Lemon Squeezy Verify]: Order introuvable dans Appwrite:', { orderId, lqOrderId });
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

	// TOUJOURS vérifier et créer l'accès dans access_grants
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
					granted_by: 'lemonsqueezy',
					created_at: paidAt
				}
			}).catch((e) => console.error('[Access grant create error in fulfillOrder]:', e));
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
		return true;
	}

	const transaction = await tables.createTransaction({ ttl: 60 });
	try {
		if (productType === 'coaching' && productId) {
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
async function verifyAndFulfillByEmail(userEmail: string, targetOrderId?: string, loggedInUserId?: string) {
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
	let userId: string | null = loggedInUserId || null;
	if (!userId) {
		try {
			const userList = await users.list([Query.equal('email', normalizedEmail), Query.limit(1)]);
			if (userList.users.length > 0) {
				userId = userList.users[0].$id;
			}
		} catch (e) {
			console.warn('[Lemon Squeezy Verify]: Utilisateur introuvable dans Appwrite Users par email:', e);
		}
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
	let alreadyClaimedByOtherCount = 0;
	const paidAt = new Date().toISOString();

	for (const order of orders) {
		const attributes = order.attributes || {};
		const status = String(attributes.status || '').toLowerCase();

		if (status !== 'paid') continue; // Seules les commandes confirmées

		const lqOrderId = String(order.id || attributes.identifier || '').trim();
		const lqVariantId = String(
			attributes.first_order_item?.variant_id ||
			attributes.variant_id ||
			''
		).trim();

		const customData = attributes.custom_data || {};
		const metaProductId = customData.product_id;
		const metaProductType = customData.product_type;
		const metaUserId = customData.user_id;
		const metaOrderId = customData.order_id || targetOrderId;

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

		let targetUserId = loggedInUserId || userId;
		if (!targetUserId || targetUserId === 'admin') {
			targetUserId = (metaUserId && metaUserId !== 'admin') ? metaUserId : (userId || undefined);
		}

		if (targetUserId) {
			// Vérifier si cette commande Lemon Squeezy a déjà été réclamée par UN AUTRE compte utilisateur
			let existingClaimedOrder: any = null;
			if (lqOrderId) {
				try {
					const claimedCheck = await tables.listRows({
						databaseId: DATABASE_ID,
						tableId: ORDERS_TABLE,
						queries: [
							Query.equal('payment_id', lqOrderId),
							Query.equal('status', 'paid'),
							Query.limit(1)
						]
					});
					if (claimedCheck.rows.length) {
						existingClaimedOrder = claimedCheck.rows[0];
					}
				} catch {}
			}

			if (
				existingClaimedOrder &&
				existingClaimedOrder.user_id &&
				existingClaimedOrder.user_id !== 'admin' &&
				existingClaimedOrder.user_id !== targetUserId
			) {
				console.warn(`[Lemon Squeezy Verify]: Commande ${lqOrderId} déjà réclamée par l'utilisateur ${existingClaimedOrder.user_id}`);
				alreadyClaimedByOtherCount++;
				continue; // Déjà attribuée à un autre compte (premier arrivé, premier servi !)
			}

			// Créer l'accès dans access_grants pour targetUserId
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

			// Mettre à jour la commande dans ORDERS_TABLE vers status: "paid" et user_id: targetUserId
			const rowToUpdate = metaOrderId || targetOrderId;
			if (rowToUpdate) {
				await tables.updateRow({
					databaseId: DATABASE_ID,
					tableId: ORDERS_TABLE,
					rowId: rowToUpdate,
					data: {
						status: 'paid',
						user_id: targetUserId,
						payment_id: lqOrderId,
						paid_at: paidAt
					}
				}).catch((e) => console.warn('[Order update to paid failed]:', e));
			} else {
				try {
					const pendingOrders = await tables.listRows({
						databaseId: DATABASE_ID,
						tableId: ORDERS_TABLE,
						queries: [
							Query.equal('product_id', matchedProduct.id),
							Query.equal('status', 'pending'),
							Query.limit(1)
						]
					});
					if (pendingOrders.rows.length) {
						await tables.updateRow({
							databaseId: DATABASE_ID,
							tableId: ORDERS_TABLE,
							rowId: pendingOrders.rows[0].$id,
							data: {
								status: 'paid',
								user_id: targetUserId,
								payment_id: lqOrderId,
								paid_at: paidAt
							}
						}).catch(() => undefined);
					}
				} catch { /* ignore */ }
			}

			if (!grantedProducts.includes(matchedProduct.title)) {
				grantedProducts.push(matchedProduct.title);
			}
		}
	}

	if (grantedProducts.length === 0 && alreadyClaimedByOtherCount > 0) {
		return {
			success: false,
			grantedProducts: [],
			message: `Peman ki lye ak imel "${normalizedEmail}" la te deja debloke sou yon lòt kont.`
		};
	}

	return {
		success: grantedProducts.length > 0,
		grantedProducts,
		message: grantedProducts.length > 0
			? `Aksè debloke ak siksè !`
			: `Peman pa kat la jwenn men okenn Variant ID pa matche ak yon pwodui Appwrite.`
	};
}

async function logVerification(
	userId: string,
	inputValue: string,
	method: 'carte' | 'mobile',
	status: 'success' | 'failed',
	message: string,
	grantedItems?: string
) {
	try {
		const { tables } = adminServices();
		await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: 'verification_logs',
			rowId: ID.unique(),
			data: {
				user_id: userId,
				input_value: inputValue,
				method,
				status,
				message: (message || '').substring(0, 1000),
				granted_items: (grantedItems || '').substring(0, 500),
				created_at: new Date().toISOString()
			}
		});
	} catch (e) {
		console.warn('[Verification log save error]:', e);
	}
}

/**
 * Endpoint POST : Vérification par Email depuis le formulaire du site OU Webhook
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
			const inputEmail = payload.email.trim().toLowerCase();

			// 1. Pre-check dans verification_logs avant d'appeler l'API Lemon Squeezy
			const { tables } = adminServices();
			const existingSuccessLog = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: 'verification_logs',
				queries: [
					Query.equal('input_value', inputEmail),
					Query.equal('status', 'success'),
					Query.limit(1)
				]
			}).catch(() => ({ rows: [] }));

			if (existingSuccessLog.rows.length > 0) {
				const message = `Imel sa a ("${inputEmail}") te deja itilize ak siksè pou debloke yon fòmasyon sou yon kont. Peman sa a pa ka re-itilize.`;
				await logVerification(
					user.$id,
					inputEmail,
					'carte',
					'failed',
					message
				);
				return json({ success: false, message }, { status: 400 });
			}

			const result = await verifyAndFulfillByEmail(inputEmail, undefined, user.$id);

			await logVerification(
				user.$id,
				inputEmail,
				'carte',
				result.success ? 'success' : 'failed',
				result.message || '',
				result.grantedProducts?.join(', ') || ''
			);

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
export const GET: RequestHandler = async ({ request, url }) => {
	const orderId = url.searchParams.get('order_id') || url.searchParams.get('orderId');
	if (!orderId) {
		return json({ success: false, message: 'order_id est requis.' }, { status: 400 });
	}

	try {
		const { tables } = adminServices();
		const user = await requirePaymentUser(request).catch(() => null);

		let orderRow: any = null;

		// 1. Chercher par rowId (orderId)
		try {
			orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId });
		} catch {
			// Fallback: Chercher par payment_id
			const listByPayment = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: ORDERS_TABLE,
				queries: [Query.equal('payment_id', orderId), Query.limit(1)]
			}).catch(() => ({ rows: [] }));
			if (listByPayment.rows.length) {
				orderRow = listByPayment.rows[0];
			}
		}

		if (!orderRow) {
			return json({ success: false, message: 'Commande introuvable.' }, { status: 404 });
		}

		const targetUserId = user?.$id || (orderRow.user_id && orderRow.user_id !== 'admin' ? orderRow.user_id : null);

		// 2. Toujours s'assurer atomiquement que l'accès existe dans access_grants pour cet utilisateur
		if (targetUserId && orderRow.product_id && (orderRow.product_type === 'course' || orderRow.product_type === 'ebook')) {
			const existingAccess = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: ACCESS_TABLE,
				queries: [
					Query.equal('user_id', targetUserId),
					Query.equal('item_type', orderRow.product_type),
					Query.equal('item_id', orderRow.product_id),
					Query.limit(1)
				]
			}).catch(() => ({ rows: [] }));

			if (existingAccess.rows.length === 0) {
				await tables.createRow({
					databaseId: DATABASE_ID,
					tableId: ACCESS_TABLE,
					rowId: ID.unique(),
					data: {
						user_id: targetUserId,
						item_type: orderRow.product_type,
						item_id: orderRow.product_id,
						granted_by: 'lemonsqueezy_get_verify',
						created_at: new Date().toISOString()
					}
				}).catch((e) => console.error('[Access grant create error]:', e));
			}

			if (orderRow.status !== 'paid' || !orderRow.user_id || orderRow.user_id === 'admin') {
				orderRow = await tables.updateRow({
					databaseId: DATABASE_ID,
					tableId: ORDERS_TABLE,
					rowId: orderRow.$id,
					data: { status: 'paid', user_id: targetUserId, paid_at: new Date().toISOString() }
				}).catch(() => orderRow);
			}
		}

		// 3. Fallback: Interroger Lemon Squeezy API par email si toujours pas marked paid
		if (orderRow.status !== 'paid' && orderRow.customer_email) {
			try {
				await verifyAndFulfillByEmail(orderRow.customer_email, orderRow.$id, targetUserId || undefined);
				orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderRow.$id }).catch(() => orderRow);
			} catch (e) {
				console.warn('[Lemon Squeezy GET Verify Fallback Error]:', e);
			}
		}

		return json({
			success: true,
			order: {
				id: orderRow.$id,
				customerName: orderRow.customer_name || '',
				customerEmail: orderRow.customer_email || '',
				productType: orderRow.product_type,
				productId: orderRow.product_id,
				productTitle: orderRow.product_title || '',
				amount: orderRow.amount || 0,
				currency: 'USD',
				paymentProvider: 'lemonsqueezy',
				status: orderRow.status,
				createdAt: orderRow.created_at || orderRow.$createdAt,
				paidAt: orderRow.paid_at
			}
		});
	} catch (e) {
		console.error('[API Lemon Squeezy GET Verify Error]:', e);
		return json({ success: false, message: 'Commande introuvable.' }, { status: 404 });
	}
};
