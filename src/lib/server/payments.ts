import { env } from '$env/dynamic/private';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT } from '$env/static/public';
import { Account, Client, ID, Query, type Models } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import type { Order } from '$lib/services/orders';
import { sendPurchaseConfirmationEmail } from '$lib/server/purchase-email';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

const ORDERS_TABLE = 'orders';
const ACCESS_TABLE = 'access_grants';
const BOOKINGS_TABLE = 'bookings';
const PAYMENT_METHODS = ['moncash', 'natcash', 'carte'] as const;
const MERCHANT_URL = 'https://plopplop.solutionip.app/api/paiement-marchand';
const VERIFY_URL = 'https://plopplop.solutionip.app/api/paiement-verify';
const RECENT_PENDING_ORDER_MS = 10 * 60 * 1000;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type AuthenticatedUser = Models.User<Models.Preferences>;

export class PaymentServerError extends Error {
	constructor(message: string, public status = 500, public providerStatus?: number) {
		super(message);
		this.name = 'PaymentServerError';
	}
}

export interface InitiatePaymentParams {
	productType: 'course' | 'ebook' | 'coaching';
	productId: string;
	bookingId?: string;
	paymentMethod: PaymentMethod;
}

export interface PaymentInitiationResult {
	success: boolean;
	status: boolean;
	orderId: string;
	paymentId: string;
	transaction_id: string;
	url: string;
	redirectUrl: string;
	message: string;
}

export interface PaymentConfirmationResult {
	success: boolean;
	order: Order | null;
	message: string;
	emailSent?: boolean;
}

export interface PaymentProviderTrace {
	request: Record<string, unknown>;
	response: Record<string, unknown>;
}

type PaymentTraceHandler = (trace: PaymentProviderTrace) => void;

export async function requirePaymentUser(request: Request): Promise<AuthenticatedUser> {
	const match = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
	if (!match) throw new PaymentServerError('Authentification requise.', 401);
	try {
		const client = new Client()
			.setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
			.setProject(PUBLIC_APPWRITE_PROJECT)
			.setJWT(match[1]);
		return await new Account(client).get();
	} catch {
		throw new PaymentServerError('Session invalide ou expirée.', 401);
	}
}

function merchantConfig() {
	const clientId = env.PLOPPLOP_CLIENT_ID?.trim();
	if (!clientId) throw new PaymentServerError('PLOPPLOP_CLIENT_ID n’est pas configuré sur le serveur.', 503);
	const apiKey = (env.PLOPPLOP_API_KEY || env.PLOPPLOP_SECRET_KEY || '').trim();
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
		headers['x-api-key'] = apiKey;
	}
	return { clientId, headers };
}

async function postJson(
	url: string,
	headers: Record<string, string>,
	payload: object,
	onTrace?: PaymentTraceHandler
) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 15_000);
	const startedAt = Date.now();
	const requestTrace = { method: 'POST', endpoint: url, headers, body: payload };
	let traceEmitted = false;
	const emitTrace = (response: Record<string, unknown>) => {
		traceEmitted = true;
		onTrace?.({ request: requestTrace, response: { ...response, durationMs: Date.now() - startedAt } });
	};
	try {
		const response = await fetch(url, {
			method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal
		});
		const text = await response.text();
		let data: any = null;
		let invalidJson = false;
		try { data = text ? JSON.parse(text) : null; }
		catch { invalidJson = true; }
		emitTrace({
			statusCode: response.status,
			headers: Object.fromEntries(response.headers.entries()),
			invalidJson,
			body: invalidJson ? text : data
		});
		if (invalidJson) throw new PaymentServerError('Réponse invalide de la passerelle de paiement.', 502, response.status);
		if (!response.ok) {
			throw new PaymentServerError(data?.message || 'La passerelle a répondu avec le statut ' + response.status + '.', 502, response.status);
		}
		return data;
	} catch (error) {
		if (error instanceof PaymentServerError) throw error;
		if (error instanceof Error && error.name === 'AbortError') {
			if (!traceEmitted) emitTrace({ statusCode: 504, body: { message: 'Délai de réponse dépassé.' } });
			throw new PaymentServerError('La passerelle de paiement ne répond pas.', 504, 504);
		}
		if (!traceEmitted) emitTrace({ statusCode: 502, body: { message: 'Connexion à la passerelle impossible.' } });
		throw new PaymentServerError('Impossible de contacter la passerelle de paiement.', 502, 502);
	} finally { clearTimeout(timer); }
}

function mapOrder(row: any): Order {
	return {
		id: row.$id,
		userId: row.user_id || undefined,
		customerName: row.customer_name || '',
		customerEmail: row.customer_email || '',
		customerPhone: row.customer_phone || undefined,
		productType: row.product_type,
		productId: row.product_id,
		productTitle: row.product_title || '',
		amount: typeof row.amount === 'number' ? row.amount : 0,
		currency: row.currency || 'HTG',
		paymentProvider: row.payment_provider || 'moncash',
		paymentId: row.payment_id || undefined,
		status: row.status || 'pending',
		createdAt: row.created_at || row.$createdAt,
		paidAt: row.paid_at || undefined
	};
}

async function resolvePurchase(params: InitiatePaymentParams, user: AuthenticatedUser) {
	const { tables } = adminServices();
	if (!['course', 'ebook', 'coaching'].includes(params.productType)) {
		throw new PaymentServerError('Type de produit invalide.', 400);
	}
	if (!PAYMENT_METHODS.includes(params.paymentMethod)) {
		throw new PaymentServerError('Moyen de paiement invalide.', 400);
	}

	if (params.productType === 'course' || params.productType === 'ebook') {
		const tableId = params.productType === 'course' ? 'courses' : 'ebooks';
		let product: any;
		try { product = await tables.getRow({ databaseId: DATABASE_ID, tableId, rowId: params.productId }); }
		catch { throw new PaymentServerError('Produit introuvable.', 404); }
		if (!product.published) throw new PaymentServerError('Ce produit n’est pas disponible à la vente.', 409);
		const amount = Number(product.price);
		if (product.is_free || !Number.isFinite(amount) || amount <= 0) {
			throw new PaymentServerError('Ce produit ne nécessite pas de paiement.', 400);
		}
		const access = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId: ACCESS_TABLE,
			queries: [Query.equal('user_id', user.$id), Query.equal('item_type', params.productType), Query.equal('item_id', params.productId), Query.limit(1)]
		});
		if (access.rows.length) throw new PaymentServerError('Vous possédez déjà ce produit.', 409);
		const variantId = String(product.lemonsqueezy_variant_id || product.variant_id || '').trim();
		return { productId: params.productId, productTitle: String(product.title || 'Produit'), amount, customerPhone: '', variantId };
	}

	if (!params.bookingId) throw new PaymentServerError('Réservation de coaching manquante.', 400);
	let booking: any;
	try { booking = await tables.getRow({ databaseId: DATABASE_ID, tableId: BOOKINGS_TABLE, rowId: params.bookingId }); }
	catch { throw new PaymentServerError('Réservation introuvable.', 404); }
	if (booking.user_id !== user.$id) throw new PaymentServerError('Accès refusé à cette réservation.', 403);
	if (booking.status !== 'pending_payment' || booking.payment_status !== 'pending') {
		throw new PaymentServerError('Cette réservation n’est pas en attente de paiement.', 409);
	}
	let service: any;
	try {
		service = await tables.getRow({ databaseId: DATABASE_ID, tableId: 'coaching_services', rowId: booking.service_id });
	} catch { throw new PaymentServerError('Service de coaching introuvable.', 404); }
	const amount = Number(service.price);
	if (!service.active || service.is_free || !Number.isFinite(amount) || amount <= 0) {
		throw new PaymentServerError('Ce service ne peut pas être payé actuellement.', 409);
	}
	const variantId = String(service.lemonsqueezy_variant_id || service.variant_id || '').trim();
	return {
		productId: booking.$id,
		productTitle: String(service.title || 'Coaching'),
		amount,
		customerPhone: String(booking.customer_whatsapp || ''),
		variantId
	};
}

async function rejectRecentPendingOrder(
	tables: ReturnType<typeof adminServices>['tables'],
	userId: string,
	productType: InitiatePaymentParams['productType'],
	productId: string
) {
	const cutoff = new Date(Date.now() - RECENT_PENDING_ORDER_MS).toISOString();
	const recentPending = await tables.listRows({
		databaseId: DATABASE_ID,
		tableId: ORDERS_TABLE,
		queries: [
			Query.equal('user_id', userId),
			Query.equal('product_type', productType),
			Query.equal('product_id', productId),
			Query.equal('status', 'pending'),
			Query.greaterThanEqual('created_at', cutoff),
			Query.limit(1)
		]
	});
	if (recentPending.rows.length) {
		throw new PaymentServerError(
			'Une première demande de paiement est déjà en cours de vérification. Veuillez patienter quelques minutes avant de réessayer.',
			409
		);
	}
}

export async function initiateLemonSqueezyPaymentServer(
	params: InitiatePaymentParams & { variantId?: string; originUrl?: string },
	user: AuthenticatedUser
): Promise<PaymentInitiationResult> {
	const apiKey = env.LEMONSQUEEZY_API_KEY?.trim();
	const storeId = env.LEMONSQUEEZY_STORE_ID?.trim();

	if (!apiKey || !storeId) {
		throw new PaymentServerError('Lemon Squeezy n’est pas configuré sur le serveur (LEMONSQUEEZY_API_KEY ou LEMONSQUEEZY_STORE_ID manquant dans .env).', 503);
	}

	const purchase = await resolvePurchase(params, user);
	const { tables } = adminServices();
	await rejectRecentPendingOrder(tables, user.$id, params.productType, purchase.productId);

	const variantId = (
		params.variantId ||
		purchase.variantId ||
		env.LEMONSQUEEZY_VARIANT_ID ||
		env.LEMONSQUEEZY_DEFAULT_VARIANT_ID ||
		''
	).trim();

	if (!variantId) {
		throw new PaymentServerError('Identifiant de variant Lemon Squeezy manquant (LEMONSQUEEZY_VARIANT_ID dans .env).', 400);
	}

	lemonSqueezySetup({ apiKey });

	const orderId = ID.unique();
	const now = new Date().toISOString();

	await tables.createRow({
		databaseId: DATABASE_ID,
		tableId: ORDERS_TABLE,
		rowId: orderId,
		data: {
			user_id: user.$id,
			customer_name: user.name || 'Client',
			customer_email: user.email,
			customer_phone: purchase.customerPhone || undefined,
			product_type: params.productType,
			product_id: purchase.productId,
			product_title: purchase.productTitle,
			amount: purchase.amount,
			currency: 'USD',
			payment_provider: 'lemonsqueezy',
			status: 'pending',
			created_at: now
		}
	});

	try {
		const redirectUrl = params.originUrl
			? `${params.originUrl}/checkout/success?order_id=${orderId}`
			: `https://djrakademi.net/checkout/success?order_id=${orderId}`;

		const checkoutResponse = await createCheckout(storeId, variantId, {
			checkoutData: {
				email: user.email,
				name: user.name || undefined,
				custom: {
					user_id: user.$id,
					order_id: orderId,
					product_id: purchase.productId,
					product_type: params.productType
				}
			},
			productOptions: {
				redirectUrl
			}
		});

		if (checkoutResponse.error) {
			console.error('[Lemon Squeezy Checkout Error]:', checkoutResponse.error);
			throw new PaymentServerError(
				checkoutResponse.error.message || 'Erreur lors de la création du checkout Lemon Squeezy.',
				502
			);
		}

		const checkoutUrl = checkoutResponse.data?.data.attributes.url;
		if (!checkoutUrl) {
			throw new PaymentServerError('URL de paiement Lemon Squeezy introuvable.', 502);
		}

		await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: ORDERS_TABLE,
			rowId: orderId,
			data: { payment_id: orderId }
		});

		return {
			success: true,
			status: true,
			orderId,
			paymentId: orderId,
			transaction_id: orderId,
			url: checkoutUrl,
			redirectUrl: checkoutUrl,
			message: 'Redirection vers Lemon Squeezy...'
		};
	} catch (error) {
		await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: ORDERS_TABLE,
			rowId: orderId,
			data: { status: 'failed' }
		}).catch(() => undefined);
		throw error;
	}
}

export async function initiatePlopplopPaymentServer(
	params: InitiatePaymentParams & { originUrl?: string },
	user: AuthenticatedUser,
	onTrace?: PaymentTraceHandler
): Promise<PaymentInitiationResult> {
	if (params.paymentMethod === 'carte') {
		throw new PaymentServerError('Les paiements par carte bancaire sont traités exclusivement via Lemon Squeezy.', 400);
	}
	const purchase = await resolvePurchase(params, user);
	const { tables } = adminServices();
	await rejectRecentPendingOrder(tables, user.$id, params.productType, purchase.productId);
	const { clientId, headers } = merchantConfig();
	const orderId = ID.unique();
	const now = new Date().toISOString();
	await tables.createRow({
		databaseId: DATABASE_ID,
		tableId: ORDERS_TABLE,
		rowId: orderId,
		data: {
			user_id: user.$id,
			customer_name: user.name || 'Client',
			customer_email: user.email,
			customer_phone: purchase.customerPhone || undefined,
			product_type: params.productType,
			product_id: purchase.productId,
			product_title: purchase.productTitle,
			amount: purchase.amount,
			currency: 'HTG',
			payment_provider: params.paymentMethod,
			status: 'pending',
			created_at: now
		}
	});

	try {
		const data = await postJson(MERCHANT_URL, headers, {
			client_id: clientId,
			refference_id: orderId,
			montant: purchase.amount,
			payment_method: params.paymentMethod
		}, onTrace);
		const redirectUrl = typeof data?.url === 'string' ? data.url.trim() : '';
		const transactionId = String(data?.transaction_id || '').trim();
		if (data?.status !== true || !redirectUrl || !transactionId) {
			throw new PaymentServerError(data?.message || 'La passerelle n’a pas créé la transaction.', 502);
		}
		let parsedUrl: URL;
		try { parsedUrl = new URL(redirectUrl); }
		catch { throw new PaymentServerError('URL de paiement invalide reçue de la passerelle.', 502); }
		if (parsedUrl.protocol !== 'https:') {
			throw new PaymentServerError('URL de paiement non sécurisée reçue de la passerelle.', 502);
		}
		await tables.updateRow({
			databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId,
			data: { payment_id: transactionId }
		});
		return {
			success: true, status: true, message: data.message || 'success', orderId,
			paymentId: transactionId, transaction_id: transactionId,
			url: parsedUrl.toString(), redirectUrl: parsedUrl.toString()
		};
	} catch (error) {
		await tables.updateRow({
			databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId,
			data: { status: 'failed' }
		}).catch(() => undefined);
		throw error;
	}
}

export async function confirmPlopplopPaymentServer(
	orderId: string,
	user: AuthenticatedUser,
	onTrace?: PaymentTraceHandler
): Promise<PaymentConfirmationResult> {
	const { tables } = adminServices();
	let row: any;
	try { row = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId }); }
	catch { throw new PaymentServerError('Commande introuvable.', 404); }
	if (row.user_id !== user.$id) throw new PaymentServerError('Accès refusé à cette commande.', 403);
	if (row.status === 'paid') return { success: true, order: mapOrder(row), message: 'Paiement déjà confirmé.' };
	if (row.status !== 'pending') throw new PaymentServerError('Cette commande ne peut plus être confirmée.', 409);

	const { clientId, headers } = merchantConfig();
	const verifyData = await postJson(VERIFY_URL, headers, {
		client_id: clientId,
		refference_id: orderId,
		...(row.payment_id ? { transaction_id: row.payment_id } : {})
	}, onTrace);
	if (String(verifyData?.trans_status || '').toLowerCase() !== 'ok') {
		return { success: false, order: null, message: 'Le paiement n’a pas encore été validé par la passerelle.' };
	}
	const returnedReference = verifyData?.refference_id || verifyData?.reference_id;
	if (returnedReference && String(returnedReference) !== orderId) {
		throw new PaymentServerError('La référence retournée par la passerelle ne correspond pas à la commande.', 502);
	}
	const rawAmount = verifyData?.montant ?? verifyData?.amount;
	if (rawAmount !== undefined && rawAmount !== null) {
		const returnedAmount = Number(rawAmount);
		if (!Number.isFinite(returnedAmount) || returnedAmount !== Number(row.amount)) {
			throw new PaymentServerError('Le montant confirmé ne correspond pas à la commande.', 409);
		}
	}

	const transactionId = String(verifyData?.transaction_id || verifyData?.id_transaction || row.payment_id || "");
	const paidAt = new Date().toISOString();
	const transaction = await tables.createTransaction({ ttl: 60 });
	try {
		const current: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId, transactionId: transaction.$id });
		if (current.status === "paid") {
			await tables.updateTransaction({ transactionId: transaction.$id, rollback: true });
			return { success: true, order: mapOrder(current), message: "Paiement déjà confirmé." };
		}
		if (current.status !== "pending") throw new PaymentServerError("Cette commande ne peut plus être confirmée.", 409);

		if (current.product_type === "course" || current.product_type === "ebook") {
			const existing = await tables.listRows({
				databaseId: DATABASE_ID, tableId: ACCESS_TABLE, transactionId: transaction.$id,
				queries: [Query.equal("user_id", current.user_id), Query.equal("item_type", current.product_type), Query.equal("item_id", current.product_id), Query.limit(1)]
			});
			if (!existing.rows.length) {
				await tables.createRow({
					databaseId: DATABASE_ID, tableId: ACCESS_TABLE, rowId: ID.unique(), transactionId: transaction.$id,
					data: { user_id: current.user_id, item_type: current.product_type, item_id: current.product_id, granted_by: "purchase", created_at: paidAt }
				});
			}
		} else if (current.product_type === "coaching") {
			const booking: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: BOOKINGS_TABLE, rowId: current.product_id, transactionId: transaction.$id });
			if (booking.user_id !== current.user_id) throw new PaymentServerError("La réservation appartient à un autre utilisateur.", 409);
			const slot: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: "coaching_slots", rowId: booking.slot_id, transactionId: transaction.$id });
			if (booking.status !== "pending_payment" || booking.payment_status !== "pending" || slot.status !== "held") {
				throw new PaymentServerError("Ce créneau ne peut plus être confirmé automatiquement.", 409);
			}
			await tables.updateRow({ databaseId: DATABASE_ID, tableId: "coaching_slots", rowId: slot.$id, transactionId: transaction.$id, data: { status: "booked" } });
			await tables.updateRow({
				databaseId: DATABASE_ID, tableId: BOOKINGS_TABLE, rowId: booking.$id, transactionId: transaction.$id,
				data: { status: "confirmed", payment_status: "paid", payment_id: transactionId || undefined, hold_expires_at: null, updated_at: paidAt }
			});
		}

		row = await tables.updateRow({
			databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId, transactionId: transaction.$id,
			data: { status: "paid", payment_id: transactionId || undefined, paid_at: paidAt }
		});
		await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
		const paidOrder = mapOrder(row);
		let emailSent = false;
		try {
			emailSent = (await sendPurchaseConfirmationEmail(paidOrder)).sent;
		} catch (emailError) {
			console.error('[Purchase email] Envoi impossible pour la commande', orderId, emailError instanceof Error ? emailError.message : emailError);
		}
		return { success: true, order: paidOrder, emailSent, message: "Paiement confirmé avec succès." };
	} catch (error) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		if (error instanceof PaymentServerError) throw error;
		throw new PaymentServerError("Impossible de finaliser atomiquement le paiement.", 500);
	}
}
