import { json, type RequestHandler } from '@sveltejs/kit';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { verifyPurchaseAccessToken } from '$lib/server/purchase-token';
import { Query, ID } from 'node-appwrite';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const { orderId, userId, token } = body;

		if (!orderId || !userId || !token) {
			return json({ message: 'Données de connexion manquantes.' }, { status: 400 });
		}

		// 1. Verify permanent HMAC token signature
		if (!verifyPurchaseAccessToken(orderId, userId, token)) {
			return json({ message: 'Lien d’accès invalide ou altéré.' }, { status: 403 });
		}

		const { tables, users } = adminServices();

		// 2. Fetch order to verify existence and paid status
		let orderRow: any;
		try {
			orderRow = await tables.getRow({ databaseId: DATABASE_ID, tableId: 'orders', rowId: orderId });
		} catch {
			return json({ message: 'Commande introuvable.' }, { status: 404 });
		}

		if (orderRow.status !== 'paid') {
			return json({ message: 'Cette commande n’est pas encore validée.' }, { status: 400 });
		}

		// 3. Ensure user has access grant (auto-heal)
		if (orderRow.product_id && (orderRow.product_type === 'course' || orderRow.product_type === 'ebook')) {
			const existingGrants = await tables.listRows({
				databaseId: DATABASE_ID,
				tableId: 'access_grants',
				queries: [
					Query.equal('user_id', userId),
					Query.equal('item_type', orderRow.product_type),
					Query.equal('item_id', orderRow.product_id),
					Query.limit(1)
				]
			}).catch(() => ({ rows: [] }));

			if (existingGrants.rows.length === 0) {
				await tables.createRow({
					databaseId: DATABASE_ID,
					tableId: 'access_grants',
					rowId: ID.unique(),
					data: {
						user_id: userId,
						item_type: orderRow.product_type,
						item_id: orderRow.product_id,
						granted_by: 'library_auto_heal',
						created_at: new Date().toISOString()
					}
				}).catch(() => null);
			}

			if (!orderRow.user_id || orderRow.user_id === 'admin') {
				await tables.updateRow({
					databaseId: DATABASE_ID,
					tableId: 'orders',
					rowId: orderId,
					data: { user_id: userId }
				}).catch(() => undefined);
			}
		}

		// 4. Create an Appwrite session token on-the-fly (expire in 15 mins to create session)
		const sessionToken = await users.createToken({ userId, length: 64, expire: 900 });

		return json({
			success: true,
			userId,
			secret: sessionToken.secret
		});
	} catch (error) {
		console.error('[Purchase login error]:', error);
		return json({ message: error instanceof Error ? error.message : 'Erreur lors de l’authentification.' }, { status: 500 });
	}
};
