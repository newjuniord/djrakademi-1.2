import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { requirePaymentUser } from '$lib/server/payments';
import { sendPurchaseConfirmationEmail } from '$lib/server/purchase-email';
import { ID, Query } from 'node-appwrite';

const ORDERS_TABLE = 'orders';
const ACCESS_TABLE = 'access_grants';
const BOOKINGS_TABLE = 'bookings';

/**
 * Traite et valide une commande payée via MonCash / Natcash.
 */
async function fulfillOrder(orderId: string, customData?: Record<string, any>, transactionId?: string) {
	const { tables } = adminServices();
	const paidAt = new Date().toISOString();

	let orderRow: any;
	try {
		orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: orderId });
	} catch {
		console.warn('[Payment Verify]: Order introuvable par rowId:', orderId);
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
						granted_by: 'mobile_verify',
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
						payment_id: transactionId || undefined,
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
				payment_id: transactionId || undefined,
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
				currency: orderRow.currency || 'HTG',
				paymentProvider: orderRow.payment_provider || 'moncash',
				status: 'paid',
				createdAt: orderRow.created_at || paidAt,
				paidAt: paidAt
			});
		} catch (e) {
			console.error('[Payment Verify Email Error]:', e);
		}

		return true;
	} catch (err) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		console.error('[Payment Fulfill Error]:', err);
		throw err;
	}
}

/**
 * Interroge l'API de passerelle par numéro de référence pour vérifier si trans_status est "ok" ou "no" et débloquer l'accès.
 */
async function verifyAndFulfillByPlopplopReference(referenceId: string, userId: string) {
	const ref = referenceId.trim();
	if (!ref) {
		return { success: false, message: 'Nimewo referans an valab.' };
	}

	const clientId = env.PLOPPLOP_CLIENT_ID?.trim();
	const apiKey = (env.PLOPPLOP_API_KEY || env.PLOPPLOP_SECRET_KEY || '').trim();

	const { tables } = adminServices();

	// 1. Chercher la commande dans Appwrite par rowId ou par payment_id
	let orderRow: any = null;
	try {
		orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: ref });
	} catch {
		try {
			const list = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: ORDERS_TABLE,
				queries: [Query.equal('payment_id', ref), Query.limit(1)]
			});
			if (list.rows.length > 0) {
				orderRow = list.rows[0];
			}
		} catch (e) {
			console.warn('[Payment Verify Search Error]:', e);
		}
	}

	// 2. Si la commande existe dans notre base et est déjà payée
	if (orderRow && orderRow.status === 'paid') {
		return {
			success: true,
			message: `Peman MonCash / Natcash sa a ("${orderRow.product_title || 'Pwodui'}") te deja konfime ak debloke !`
		};
	}

	// 3. Interroger l'API de la passerelle
	if (clientId) {
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
			headers['x-api-key'] = apiKey;
		}

		try {
			const gatewayRes = await fetch('https://plopplop.solutionip.app/api/paiement-verify', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					client_id: clientId,
					refference_id: orderRow ? orderRow.$id : ref
				})
			});

			const verifyData = await gatewayRes.json().catch(() => ({}));

			if (verifyData) {
				const transStatus = String(verifyData.trans_status || '').toLowerCase();

				// CAS: Confirmation OK -> Débloquer l'accès !
				if (transStatus === 'ok') {
					const targetOrderId = orderRow ? orderRow.$id : ref;
					await fulfillOrder(targetOrderId, {
						user_id: userId,
						product_id: orderRow?.product_id,
						product_type: orderRow?.product_type
					}, verifyData.id_transaction || verifyData.transaction_id || ref);

					return {
						success: true,
						message: `Peman MonCash / Natcash (${verifyData.method?.toUpperCase() || 'Mobile'}) verifye ak siksè (Statut: OK) ! Aksè a debloke.`
					};
				}

				// CAS: Peman an en attente / non encore validé ("no")
				if (transStatus === 'no') {
					return {
						success: false,
						message: `Peman MonCash / Natcash sa a poko valide (Statut: En attente / No). Tanpri verifye ke vèsman an te byen fèt epi eseye ankò nan yon ti moman.`
					};
				}

				// CAS: Transaction introuvable sur la passerelle ("not_found" ou status false)
				if (verifyData.status === false || verifyData.message === 'not_found' || verifyData.message === 'transaction_not_found') {
					return {
						success: false,
						notFound: true,
						message: `Nou pa jwenn okenn tranzaksyon ki koresponn ak referans "${ref}". Tanpri verifye si se menm referans ki sou mesaj konfimasyon an.`
					};
				}
			}
		} catch (err) {
			console.error('[Payment API Call Error]:', err);
		}
	}

	return {
		success: false,
		notFound: true,
		message: `Nou pa jwenn okenn tranzaksyon ki koresponn ak referans "${ref}". Tanpri verifye si referans lan egzak.`
	};
}

/**
 * Endpoint POST : Vérification d'une référence MonCash / Natcash (nécessite d'être connecté)
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Vérification de la connexion de l'utilisateur
		const user = await requirePaymentUser(request).catch(() => null);
		if (!user) {
			return json(
				{ success: false, message: 'Ou dwe konekte sou kont ou pou w ka verifye yon peman.' },
				{ status: 401 }
			);
		}

		const rawBody = await request.text();
		let payload: any = {};
		try {
			payload = JSON.parse(rawBody);
		} catch {
			return json({ success: false, message: 'Payload JSON invalide.' }, { status: 400 });
		}

		const reference = payload?.reference || payload?.reference_id || payload?.refference_id || payload?.ref;
		if (!reference || typeof reference !== 'string' || !reference.trim()) {
			return json({ success: false, message: 'Tanpri antre yon nimewo referans ki valab.' }, { status: 400 });
		}

		const result = await verifyAndFulfillByPlopplopReference(reference, user.$id);
		return json(result, { status: result.success ? 200 : (result.notFound ? 404 : 400) });
	} catch (error) {
		console.error('[API Verify Error]:', error instanceof Error ? error.message : error);
		return json(
			{ success: false, message: error instanceof Error ? error.message : 'Erreur lors de la vérification.' },
			{ status: 500 }
		);
	}
};

/**
 * Endpoint GET : Vérification directe d'une référence par URL search param
 */
export const GET: RequestHandler = async ({ request, url }) => {
	const user = await requirePaymentUser(request).catch(() => null);
	if (!user) {
		return json(
			{ success: false, message: 'Ou dwe konekte sou kont ou pou w ka verifye yon peman.' },
			{ status: 401 }
		);
	}

	const ref = url.searchParams.get('reference') || url.searchParams.get('refference_id') || url.searchParams.get('ref');
	if (!ref) {
		return json({ success: false, message: 'Le paramètre reference est requis.' }, { status: 400 });
	}

	const result = await verifyAndFulfillByPlopplopReference(ref, user.$id);
	return json(result, { status: result.success ? 200 : (result.notFound ? 404 : 400) });
};
