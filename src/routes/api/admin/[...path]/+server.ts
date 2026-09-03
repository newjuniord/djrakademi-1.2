import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	AdminServerError,
	BRANDING_BUCKET_ID,
	DATABASE_ID,
	ID,
	Query,
	SETTINGS_ROW_ID,
	SETTINGS_TABLE,
	adminServices,
	listAllRows,
	mapAdminUser,
	mapOrder,
	mapSettings,
	normalizePage,
	publicFilePermissions,
	requireAdmin,
	validateLogo
} from '$lib/server/admin-appwrite';
import { mapBooking } from '$lib/server/bookings';

function responseError(error: unknown) {
	if (error instanceof AdminServerError) return json({ message: error.message }, { status: error.status });
	const code = typeof (error as any)?.code === 'number' ? (error as any).code : 500;
	const message = (error as any)?.message || 'Erreur interne de l’API admin.';
	console.error('[Admin API Error]:', code, message, error);
	return json({ message: code === 404 ? 'Ressource Appwrite introuvable.' : message }, { status: code >= 400 && code < 600 ? code : 500 });
}

function pathParts(path?: string) {
	return (path || '').split('/').filter(Boolean).map(decodeURIComponent);
}

function grantCounts(grants: any[]) {
	const counts = new Map<string, { courseCount: number; ebookCount: number }>();
	for (const grant of grants) {
		const current = counts.get(grant.user_id) || { courseCount: 0, ebookCount: 0 };
		if (grant.item_type === 'course') current.courseCount += 1;
		if (grant.item_type === 'ebook') current.ebookCount += 1;
		counts.set(grant.user_id, current);
	}
	return counts;
}

function accessKeys(grants: any[]) {
	return new Set(grants.map((grant) => `${grant.user_id}:${grant.item_type}:${grant.item_id}`));
}

async function getProfileByUserId(tables: ReturnType<typeof adminServices>['tables'], userId: string) {
	const result = await tables.listRows({ databaseId: DATABASE_ID, tableId: 'profiles', queries: [Query.equal('user_id', userId), Query.limit(1)] });
	return result.rows[0] || null;
}

async function getSettingsRow(tables: ReturnType<typeof adminServices>['tables']) {
	try {
		return await tables.getRow({ databaseId: DATABASE_ID, tableId: SETTINGS_TABLE, rowId: SETTINGS_ROW_ID });
	} catch (error: any) {
		if (error?.code === 404) return null;
		throw error;
	}
}

function parseJsonObject(value: unknown): Record<string, any> {
	if (typeof value !== 'string' || !value) return {};
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch { return {}; }
}

function plopplopStatusText(statusCode: number, endpoint: string, errorMessage?: string): string {
	if (statusCode === 200) return endpoint.includes('paiement-marchand') ? 'OK Transaction créée.' : 'OK';
	if (statusCode === 202) return 'Paiement en attente.';
	if (statusCode === 400) return endpoint.includes('paiement-verify') ? 'Paramètres manquants.' : 'Paramètre manquant / montant invalide.';
	if (statusCode === 401) return 'Identifiants invalides.';
	if (statusCode === 403) return 'Compte inactif.';
	if (statusCode === 404) return endpoint.includes('paiement-marchand') ? 'Client introuvable ou référence déjà utilisée.' : 'Transaction introuvable.';
	if (statusCode === 405) return 'Méthode HTTP non autorisée.';
	if (statusCode === 408) return 'Commande expirée.';
	if (statusCode === 409) return 'Conflit de paiement.';
	if (statusCode === 429) return 'Trop de requêtes.';
	if (statusCode === 502) return 'Réponse de passerelle invalide.';
	if (statusCode === 503) return 'Erreur interne.';
	if (statusCode === 504) return 'Délai de réponse dépassé.';
	if (errorMessage) return 'Échec';
	if (statusCode >= 500) return 'Erreur de passerelle';
	return 'Requête refusée';
}

function recordValue(value: unknown): Record<string, any> {
	return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function paymentHealthLog(row: any) {
	const requestPayload = parseJsonObject(row.request_payload);
	const responsePayload = parseJsonObject(row.response_payload);
	const requestBody = recordValue(requestPayload.body);
	const requestHeaders = recordValue(requestPayload.headers);
	const expiration = row.event_type === 'cron_verification' && requestPayload.action === 'expire_order';
	const defaultEndpoint = row.event_type === 'initiation'
		? 'https://plopplop.solutionip.app/api/paiement-marchand'
		: row.event_type === 'webhook_received'
			? '/api/payments/confirm'
			: 'https://plopplop.solutionip.app/api/paiement-verify';
	const endpoint = expiration
		? '/maintenance/orders/expire'
		: typeof requestPayload.endpoint === 'string' && requestPayload.endpoint
			? requestPayload.endpoint
			: defaultEndpoint;
	const statusCode = Number(row.status_code) || 500;
	const duration = Number(responsePayload.durationMs);
	const method = expiration ? 'PATCH' : typeof requestPayload.method === 'string' ? requestPayload.method : 'POST';
	const normalizedRequest = Object.keys(requestPayload).length
		? requestPayload
		: { method, endpoint, body: { ...(row.order_id ? { refference_id: row.order_id } : {}) } };
	const normalizedResponse = {
		...responsePayload,
		...(row.payment_id ? { transactionId: row.payment_id } : {}),
		...(row.error_message ? { error: row.error_message } : {})
	};
	return {
		id: row.$id,
		method,
		endpoint,
		statusCode,
		statusText: plopplopStatusText(statusCode, endpoint, row.error_message),
		responseTimeMs: Number.isFinite(duration) ? duration : 0,
		clientIp: row.event_type === 'cron_verification' ? 'Cron Appwrite' : 'Backend SvelteKit',
		userAgent: expiration ? 'Appwrite Function · expiration locale' : row.event_type === 'cron_verification' ? 'Appwrite Function → Plopplop' : 'Backend SvelteKit → Plopplop',
		timestamp: row.created_at || row.$createdAt,
		requestHeaders: Object.keys(requestHeaders).length ? requestHeaders : { 'Content-Type': 'application/json' },
		requestPayload: Object.keys(requestBody).length ? { ...normalizedRequest, body: requestBody } : normalizedRequest,
		responsePayload: normalizedResponse
	};
}

export const GET: RequestHandler = async ({ request, params, url }) => {
	try {
		const admin = await requireAdmin(request);
		const parts = pathParts(params.path);
		if (parts[0] === 'session' && parts.length === 1) return json({ id: admin.$id, name: admin.name, email: admin.email });

		const { tables } = adminServices();

		if (parts[0] === 'courses' && parts.length === 1) {
			const [courses, grants] = await Promise.all([
				listAllRows(tables, 'courses'),
				listAllRows(tables, 'access_grants')
			]);
			const learners = new Map<string, Set<string>>();
			for (const grant of grants) {
				if (grant.item_type !== 'course') continue;
				const users = learners.get(grant.item_id) || new Set<string>();
				if (grant.user_id) users.add(grant.user_id);
				learners.set(grant.item_id, users);
			}
			return json(courses.map((course) => ({
				id: course.$id,
				title: course.title || '',
				description: course.description || '',
				cover: course.cover || '',
				price: Number(course.price) || 0,
				isFree: Boolean(course.is_free),
				published: Boolean(course.published),
				studentCount: learners.get(course.$id)?.size || 0,
				modules: []
			})));
		}

		if (parts[0] === 'health' && parts.length === 1) {
			const configured = Boolean(env.PLOPPLOP_CLIENT_ID?.trim());
			let rows: any[] = [];
			try {
				const result = await tables.listRows({
					databaseId: DATABASE_ID, tableId: 'payment_logs',
					queries: [Query.orderDesc('created_at'), Query.limit(100)]
				});
				rows = result.rows;
			} catch (error) {
				console.warn('[Admin Health] Impossible de lire payment_logs:', error);
			}
			const logs = rows.map(paymentHealthLog);
			const latest = logs[0];
			const recentErrors = logs.slice(0, 10).filter((log) => log.statusCode >= 400 || Boolean(log.responsePayload?.error)).length;
			const status = !configured ? 'down' : recentErrors >= 3 ? 'degraded' : 'operational';
			return json({
				status,
				statusCode: !configured ? 503 : 200,
				statusText: !configured ? 'Configuration incomplète' : 'OK',
				checkedAt: new Date().toISOString(),
				logs
			});
		}

		if (parts[0] === 'overview' && parts.length === 1) {
			const { tables, users: appwriteUsers } = adminServices();
			let authUsersList: any[] = [];
			try {
				const authUsersRes = await appwriteUsers.list({ queries: [Query.orderDesc('$createdAt'), Query.limit(100)] });
				authUsersList = authUsersRes.users || [];
			} catch (e) {
				console.warn('[Admin API] Failed to list Appwrite Auth users for overview:', e);
			}

			const [orders, profiles, bookings, services, grants] = await Promise.all([
				listAllRows(tables, 'orders'), listAllRows(tables, 'profiles'), listAllRows(tables, 'bookings'),
				listAllRows(tables, 'coaching_services'), listAllRows(tables, 'access_grants')
			]);

			// Combine profiles and Appwrite Auth users
			const profileMap = new Map<string, any>();
			for (const p of profiles) {
				if (p.user_id) profileMap.set(p.user_id, p);
				profileMap.set(p.$id, p);
			}

			const userMap = new Map<string, any>();
			for (const u of authUsersList) {
				const profile = profileMap.get(u.$id);
				userMap.set(u.$id, {
					id: u.$id,
					name: profile?.name || u.name || 'Utilisateur',
					email: u.email || profile?.email || '',
					status: (u.status === false || profile?.status === 'disabled') ? 'disabled' : 'active',
					createdAt: u.$createdAt || profile?.created_at || profile?.$createdAt
				});
			}

			for (const p of profiles) {
				const id = p.user_id || p.$id;
				if (!userMap.has(id)) {
					userMap.set(id, {
						id,
						name: p.name || 'Utilisateur',
						email: p.email || '',
						status: p.status === 'disabled' ? 'disabled' : 'active',
						createdAt: p.created_at || p.$createdAt
					});
				}
			}

			const allCombinedUsers = Array.from(userMap.values());
			const disabledUsers = allCombinedUsers.filter((u) => u.status === 'disabled').length;
			allCombinedUsers.sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));

			const paid = orders.filter((order) => order.status === 'paid');
			const grantSet = accessKeys(grants);
			const serviceTitles = new Map(services.map((service) => [service.$id, service.title || service.$id]));
			const recentOrders = [...orders].sort((a, b) => Date.parse(b.created_at || b.$createdAt) - Date.parse(a.created_at || a.$createdAt)).slice(0, 5)
				.map((order) => mapOrder(order, order.product_type === 'coaching' ? undefined : grantSet.has(`${order.user_id}:${order.product_type}:${order.product_id}`)));
			
			const recentUsers = allCombinedUsers.slice(0, 5);

			const upcomingBookings = bookings.filter((booking) => booking.status !== 'cancelled' && Date.parse(booking.start_at) >= Date.now())
				.sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at)).slice(0, 5)
				.map((booking) => ({ id: booking.$id, customerName: booking.customer_name || '', serviceTitle: serviceTitles.get(booking.service_id) || booking.service_id, startAt: booking.start_at }));

			return json({
				revenue: paid.reduce((sum, order) => sum + (Number(order.amount) || 0), 0),
				paidOrders: paid.length,
				totalUsers: allCombinedUsers.length,
				disabledUsers,
				totalBookings: bookings.length,
				recentOrders,
				recentUsers,
				upcomingBookings
			});
		}

		if (parts[0] === 'users' && parts.length === 1) {
			const { page, limit, offset } = normalizePage(url);
			const search = (url.searchParams.get('search') || '').trim();
			const status = url.searchParams.get('status');
			const { tables, users: appwriteUsers } = adminServices();

			// Fetch users from Appwrite Auth
			let authUsersList: any[] = [];
			try {
				const authUsersRes = await appwriteUsers.list({ queries: [Query.orderDesc('$createdAt'), Query.limit(100)] });
				authUsersList = authUsersRes.users || [];
			} catch (e) {
				console.warn('[Admin API] Failed to list Appwrite Auth users:', e);
			}

			// Fetch profiles from database table
			let profileRows: any[] = [];
			try {
				const profilePage = await tables.listRows({ databaseId: DATABASE_ID, tableId: 'profiles', queries: [Query.limit(100)] });
				profileRows = profilePage.rows || [];
			} catch (e) {
				console.warn('[Admin API] Failed to list profiles:', e);
			}

			// Map profiles by user_id or $id
			const profileMap = new Map<string, any>();
			for (const p of profileRows) {
				if (p.user_id) profileMap.set(p.user_id, p);
				profileMap.set(p.$id, p);
			}

			// Combine Auth users and profile rows
			const userMap = new Map<string, any>();
			for (const u of authUsersList) {
				const profile = profileMap.get(u.$id);
				userMap.set(u.$id, {
					$id: u.$id,
					user_id: u.$id,
					name: profile?.name || u.name || 'Utilisateur',
					email: u.email || profile?.email || '',
					whatsapp: profile?.whatsapp || u.phone || undefined,
					status: (u.status === false || profile?.status === 'disabled') ? 'disabled' : 'active',
					created_at: u.$createdAt || profile?.created_at || profile?.$createdAt
				});
			}

			for (const p of profileRows) {
				const id = p.user_id || p.$id;
				if (!userMap.has(id)) {
					userMap.set(id, {
						$id: id,
						user_id: id,
						name: p.name || 'Utilisateur',
						email: p.email || '',
						whatsapp: p.whatsapp,
						status: p.status === 'disabled' ? 'disabled' : 'active',
						created_at: p.created_at || p.$createdAt
					});
				}
			}

			let combinedUsers = Array.from(userMap.values());

			if (status) {
				combinedUsers = combinedUsers.filter((u) => u.status === status);
			}
			if (search) {
				const s = search.toLowerCase();
				combinedUsers = combinedUsers.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
			}

			combinedUsers.sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));

			const total = combinedUsers.length;
			const paginatedUsers = combinedUsers.slice(offset, offset + limit);

			const userIds = paginatedUsers.map((u) => u.user_id);
			const grants = userIds.length ? await listAllRows(tables, 'access_grants', [Query.equal('user_id', userIds)]) : [];
			const counts = grantCounts(grants);

			return json({ items: paginatedUsers.map((profile) => mapAdminUser(profile, counts.get(profile.user_id))), total, page, limit });
		}

		if (parts[0] === 'users' && parts.length === 2) {
			let profile: any = await getProfileByUserId(tables, parts[1]);
			if (!profile) {
				const { users } = adminServices();
				try {
					const authUser = await users.get({ userId: parts[1] });
					profile = { user_id: authUser.$id, name: authUser.name, email: authUser.email, status: authUser.status === false ? 'disabled' : 'active', created_at: authUser.$createdAt };
				} catch { throw new AdminServerError('Utilisateur introuvable.', 404); }
			}
			const grants = await listAllRows(tables, 'access_grants', [Query.equal('user_id', parts[1])]);
			return json(mapAdminUser(profile, grantCounts(grants).get(parts[1])));
		}

		if (parts[0] === 'products' && parts.length === 1) {
			const [courses, ebooks] = await Promise.all([listAllRows(tables, 'courses'), listAllRows(tables, 'ebooks')]);
			return json([
				...courses.map((course) => ({ id: course.$id, title: course.title || '', type: 'course' })),
				...ebooks.map((ebook) => ({ id: ebook.$id, title: ebook.title || '', type: 'ebook' }))
			].sort((a, b) => a.title.localeCompare(b.title, 'fr')));
		}

		if (parts[0] === 'orders' && parts.length === 1) {
			const { page, limit, offset } = normalizePage(url);
			const search = (url.searchParams.get('search') || '').trim();
			const status = url.searchParams.get('status');
			const type = url.searchParams.get('type');
			const queries = [Query.orderDesc('created_at'), Query.limit(limit), Query.offset(offset)];
			if (status) queries.push(Query.equal('status', status));
			if (type) queries.push(Query.equal('product_type', type));
			if (search) {
				const reference = search.toLowerCase().startsWith('cmd-') ? search.slice(4).toLowerCase() : '';
				queries.push(Query.or([
					Query.search('customer_name', search), Query.search('customer_email', search), Query.search('product_title', search),
					...(reference ? [Query.startsWith('$id', reference)] : [])
				]));
			}
			const [orderPage, ...summaryPages] = await Promise.all([
				tables.listRows({ databaseId: DATABASE_ID, tableId: 'orders', queries }),
				...(['paid', 'pending', 'failed', 'expired'] as const).map((value) => tables.listRows({ databaseId: DATABASE_ID, tableId: 'orders', queries: [Query.equal('status', value), Query.limit(1)] }))
			]);
			const orderUserIds = [...new Set(orderPage.rows.map((order) => order.user_id).filter(Boolean))];
			const grants = orderUserIds.length ? await listAllRows(tables, 'access_grants', [Query.equal('user_id', orderUserIds)]) : [];
			const grantSet = accessKeys(grants);
			const summary = { paid: summaryPages[0].total, pending: summaryPages[1].total, failed: summaryPages[2].total, expired: summaryPages[3].total };
			return json({
				items: orderPage.rows.map((order) => mapOrder(order, order.product_type === 'coaching' ? undefined : grantSet.has(`${order.user_id}:${order.product_type}:${order.product_id}`))),
				total: orderPage.total, summary, page, limit
			});
		}

		if (parts[0] === "bookings" && parts.length === 1) {
			return json((await listAllRows(tables, "bookings")).map(mapBooking));
		}

		if (parts[0] === 'settings' && parts.length === 1) return json(mapSettings(await getSettingsRow(tables)));
		throw new AdminServerError('Route admin introuvable.', 404);
	} catch (error) { return responseError(error); }
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		await requireAdmin(request);
		const parts = pathParts(params.path);
		if (parts[0] === "bookings" && parts[1] && parts.length === 2) {
			const body = await request.json();
			if (!["completed", "cancelled"].includes(body?.status)) throw new AdminServerError("Statut de réservation invalide.", 400);
			const { tables } = adminServices();
			const transaction = await tables.createTransaction({ ttl: 60 });
			try {
				const booking: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: "bookings", rowId: parts[1], transactionId: transaction.$id });
				if (body.status === "completed" && booking.status !== "confirmed") throw new AdminServerError("Seule une réservation confirmée peut être terminée.", 409);
				if (body.status === "cancelled" && !["confirmed", "pending_payment"].includes(booking.status)) throw new AdminServerError("Cette réservation ne peut plus être annulée.", 409);
				if (body.status === "cancelled") {
					const slot: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: "coaching_slots", rowId: booking.slot_id, transactionId: transaction.$id });
					if (Date.parse(slot.start_at) > Date.now() && ["held", "booked"].includes(slot.status)) {
						await tables.updateRow({ databaseId: DATABASE_ID, tableId: "coaching_slots", rowId: slot.$id, transactionId: transaction.$id, data: { status: "available" } });
					}
					const orders = await tables.listRows({ databaseId: DATABASE_ID, tableId: "orders", transactionId: transaction.$id, queries: [Query.equal("product_type", "coaching"), Query.equal("product_id", booking.$id), Query.equal("status", "pending"), Query.limit(10)] });
					for (const order of orders.rows) await tables.updateRow({ databaseId: DATABASE_ID, tableId: "orders", rowId: order.$id, transactionId: transaction.$id, data: { status: "failed" } });
				}
				const updated = await tables.updateRow({ databaseId: DATABASE_ID, tableId: "bookings", rowId: booking.$id, transactionId: transaction.$id, data: { status: body.status, ...(body.status === "cancelled" && booking.payment_status === "pending" ? { payment_status: "failed" } : {}), updated_at: new Date().toISOString() } });
				await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
				return json(mapBooking(updated));
			} catch (error) {
				await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
				throw error;
			}
		}

		if (!(parts[0] === 'users' && parts[1] && parts[2] === 'status' && parts.length === 3)) throw new AdminServerError('Route admin introuvable.', 404);
		const body = await request.json();
		if (!['active', 'disabled'].includes(body?.status)) throw new AdminServerError('Statut utilisateur invalide.', 400);
		const { tables, users } = adminServices();
		const userId = parts[1];

		try {
			await users.updateStatus({ userId, status: body.status === 'active' });
		} catch (error) {
			console.warn('[Admin API] Could not update Appwrite Auth user status directly:', error);
		}

		let profile = await getProfileByUserId(tables, userId);
		let updatedRow: any;
		const now = new Date().toISOString();

		if (profile) {
			updatedRow = await tables.updateRow({ databaseId: DATABASE_ID, tableId: 'profiles', rowId: profile.$id, data: { status: body.status, updated_at: now } });
		} else {
			let authUser: any = null;
			try { authUser = await users.get({ userId }); } catch (e) {}
			updatedRow = await tables.createRow({
				databaseId: DATABASE_ID,
				tableId: 'profiles',
				rowId: ID.unique(),
				data: {
					user_id: userId,
					name: authUser?.name || 'Utilisateur',
					email: authUser?.email || '',
					status: body.status,
					created_at: now,
					updated_at: now
				}
			});
		}

		const grants = await listAllRows(tables, 'access_grants', [Query.equal('user_id', userId)]);
		return json(mapAdminUser(updatedRow, grantCounts(grants).get(userId)));
	} catch (error) { return responseError(error); }
};

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const admin = await requireAdmin(request);
		const parts = pathParts(params.path);
		if (parts[0] === 'users' && parts[1] && parts[2] === 'impersonate' && parts.length === 3) {
			if (parts[1] === admin.$id) throw new AdminServerError('Vous êtes déjà connecté avec ce compte.', 409);
			const { users } = adminServices();
			let target: any;
			try { target = await users.get({ userId: parts[1] }); }
			catch { throw new AdminServerError('Utilisateur introuvable.', 404); }
			if (target.status === false) throw new AdminServerError('Ce compte utilisateur est désactivé.', 409);
			const [targetToken, adminToken] = await Promise.all([
				users.createToken({ userId: target.$id, length: 64, expire: 3600 }),
				users.createToken({ userId: admin.$id, length: 64, expire: 3600 })
			]);
			return json({
				target: { userId: targetToken.userId, secret: targetToken.secret, name: target.name || target.email, expire: targetToken.expire },
				adminReturn: { userId: adminToken.userId, secret: adminToken.secret, expire: adminToken.expire }
			});
		}
		if (!(parts[0] === 'access-grants' && parts.length === 1)) throw new AdminServerError('Route admin introuvable.', 404);
		const body = await request.json();
		if (!body?.userId || !['course', 'ebook'].includes(body?.itemType) || !body?.itemId) throw new AdminServerError('Données d’accès invalides.', 400);
		const { tables, users } = adminServices();
		let profile = await getProfileByUserId(tables, body.userId);
		if (!profile) {
			let authUser: any = null;
			try { authUser = await users.get({ userId: body.userId }); } catch (e) {}
			const now = new Date().toISOString();
			profile = await tables.createRow({
				databaseId: DATABASE_ID,
				tableId: 'profiles',
				rowId: ID.unique(),
				data: {
					user_id: body.userId,
					name: authUser?.name || 'Utilisateur',
					email: authUser?.email || '',
					status: 'active',
					created_at: now,
					updated_at: now
				}
			});
		}
		try { await tables.getRow({ databaseId: DATABASE_ID, tableId: body.itemType === 'course' ? 'courses' : 'ebooks', rowId: body.itemId }); }
		catch { throw new AdminServerError('Produit introuvable.', 404); }
		const existing = await tables.listRows({ databaseId: DATABASE_ID, tableId: 'access_grants', queries: [Query.equal('user_id', body.userId), Query.equal('item_type', body.itemType), Query.equal('item_id', body.itemId), Query.limit(1)] });
		if (existing.rows.length) return json({ created: false });
		try {
			await tables.createRow({ databaseId: DATABASE_ID, tableId: 'access_grants', rowId: ID.unique(), data: { user_id: body.userId, item_type: body.itemType, item_id: body.itemId, granted_by: 'admin', created_at: new Date().toISOString() } });
			return json({ created: true }, { status: 201 });
		} catch (error: any) {
			if (error?.code === 409) return json({ created: false });
			throw error;
		}
	} catch (error) { return responseError(error); }
};

export const PUT: RequestHandler = async ({ request, params }) => {
	let uploadedFileId: string | null = null;
	try {
		await requireAdmin(request);
		const parts = pathParts(params.path);

		if (parts[0] === 'courses' && parts[1] && parts[2] === 'curriculum' && parts.length === 3) {
			const courseId = parts[1];
			const body = await request.json();
			const modules = body.modules || [];
			const { tables } = adminServices();

			const [mRes, lRes] = await Promise.all([
				listAllRows(tables, 'course_modules', [Query.equal('course_id', courseId)]),
				listAllRows(tables, 'lessons', [Query.equal('course_id', courseId)])
			]);

			const existingMods = mRes;
			const existingLessons = lRes;

			const currentModIds = new Set<string>();
			const currentLessonIds = new Set<string>();

			for (let mIdx = 0; mIdx < modules.length; mIdx++) {
				const mod = modules[mIdx];
				let modAppwriteId = mod.id;

				const isExistingMod = existingMods.some((m) => m.$id === mod.id);

				if (isExistingMod) {
					await tables.updateRow({
						databaseId: DATABASE_ID,
						tableId: 'course_modules',
						rowId: mod.id,
						data: { title: mod.title, order: mIdx }
					});
					currentModIds.add(mod.id);
				} else {
					const newModDoc = await tables.createRow({
						databaseId: DATABASE_ID,
						tableId: 'course_modules',
						rowId: ID.unique(),
						data: { course_id: courseId, title: mod.title, order: mIdx }
					});
					modAppwriteId = newModDoc.$id;
					mod.id = modAppwriteId;
					currentModIds.add(modAppwriteId);
				}

				for (let lIdx = 0; lIdx < (mod.lessons || []).length; lIdx++) {
					const lesson = mod.lessons[lIdx];
					const isExistingLesson = existingLessons.some((l) => l.$id === lesson.id);

					if (isExistingLesson) {
						await tables.updateRow({
							databaseId: DATABASE_ID,
							tableId: 'lessons',
							rowId: lesson.id,
							data: {
								course_id: courseId,
								module_id: modAppwriteId,
								title: lesson.title,
								type: lesson.type || 'video',
								video_url: lesson.videoUrl || '',
								content: lesson.content || '',
								order: lIdx
							}
						});
						currentLessonIds.add(lesson.id);
					} else {
						const newLessonDoc = await tables.createRow({
							databaseId: DATABASE_ID,
							tableId: 'lessons',
							rowId: ID.unique(),
							data: {
								course_id: courseId,
								module_id: modAppwriteId,
								title: lesson.title,
								type: lesson.type || 'video',
								video_url: lesson.videoUrl || '',
								content: lesson.content || '',
								order: lIdx
							}
						});
						lesson.id = newLessonDoc.$id;
						currentLessonIds.add(newLessonDoc.$id);
					}
				}
			}

			for (const oldMod of existingMods) {
				if (!currentModIds.has(oldMod.$id)) {
					await tables.deleteRow({ databaseId: DATABASE_ID, tableId: 'course_modules', rowId: oldMod.$id }).catch(() => undefined);
				}
			}

			for (const oldLesson of existingLessons) {
				if (!currentLessonIds.has(oldLesson.$id)) {
					await tables.deleteRow({ databaseId: DATABASE_ID, tableId: 'lessons', rowId: oldLesson.$id }).catch(() => undefined);
				}
			}

			return json({ success: true, modules });
		}

		if (!(parts[0] === 'settings' && parts.length === 1)) throw new AdminServerError('Route admin introuvable.', 404);
		const form = await request.formData();
		let settings: any;
		try { settings = JSON.parse(String(form.get('settings') || '')); }
		catch { throw new AdminServerError('Paramètres JSON invalides.', 400); }
		const siteName = String(settings?.siteName || '').trim();
		const tagline = String(settings?.tagline || '').trim();
		const contactEmail = String(settings?.contactEmail || '').trim();
		const whatsappNumber = String(settings?.whatsappNumber || '').trim();
		const timezone = String(settings?.timezone || '').trim();
		const maintenanceMode = settings?.maintenanceMode === true;
		const announcementEnabled = settings?.announcementEnabled === true;
		const announcementText = String(settings?.announcementText || '').trim();
		const announcementTextColor = ['noir', 'blanc', 'rouge'].includes(settings?.announcementTextColor) ? settings.announcementTextColor : 'blanc';
		const announcementBgColor = ['noir', 'blanc', 'rouge', 'jaune', 'verte'].includes(settings?.announcementBgColor) ? settings.announcementBgColor : 'noir';

		if (!siteName || siteName.length > 120 || tagline.length > 240 || !/^\S+@\S+\.\S+$/.test(contactEmail) || !whatsappNumber || whatsappNumber.length > 32 || !timezone || timezone.length > 64) throw new AdminServerError('Les paramètres de la plateforme sont invalides.', 400);
		try { new Intl.DateTimeFormat('fr', { timeZone: timezone }).format(); }
		catch { throw new AdminServerError('Le fuseau horaire est invalide.', 400); }

		const { tables, storage } = adminServices();
		const existing = await getSettingsRow(tables);
		const logo = form.get('logo');
		if (logo instanceof File && logo.size > 0) {
			const input = await validateLogo(logo);
			const uploaded = await storage.createFile({ bucketId: BRANDING_BUCKET_ID, fileId: ID.unique(), file: input, permissions: publicFilePermissions });
			uploadedFileId = uploaded.$id;
		}

		const now = new Date().toISOString();
		const data: Record<string, unknown> = {
			site_name: siteName,
			tagline,
			contact_email: contactEmail,
			whatsapp_number: whatsappNumber,
			timezone,
			currency: 'HTG',
			maintenance_mode: maintenanceMode,
			announcement_enabled: announcementEnabled,
			announcement_text: announcementText,
			announcement_text_color: announcementTextColor,
			announcement_bg_color: announcementBgColor,
			updated_at: now
		};
		if (uploadedFileId) data.logo_file_id = uploadedFileId;

		const trySave = async (d: Record<string, unknown>) => {
			return existing
				? await tables.updateRow({ databaseId: DATABASE_ID, tableId: SETTINGS_TABLE, rowId: SETTINGS_ROW_ID, data: d })
				: await tables.createRow({ databaseId: DATABASE_ID, tableId: SETTINGS_TABLE, rowId: SETTINGS_ROW_ID, data: { ...d, created_at: now } });
		};

		let saved: any;
		try {
			saved = await trySave(data);
		} catch (error: any) {
			const msg = String(error?.message || '');
			if (msg.includes('Unknown attribute:')) {
				const fallbackData = { ...data };
				if (msg.includes('maintenance_mode')) delete fallbackData.maintenance_mode;
				if (msg.includes('announcement_enabled')) delete fallbackData.announcement_enabled;
				if (msg.includes('announcement_text')) delete fallbackData.announcement_text;
				if (msg.includes('announcement_text_color')) delete fallbackData.announcement_text_color;
				if (msg.includes('announcement_bg_color')) delete fallbackData.announcement_bg_color;
				try {
					saved = await trySave(fallbackData);
				} catch (retryErr) {
					if (uploadedFileId) await storage.deleteFile({ bucketId: BRANDING_BUCKET_ID, fileId: uploadedFileId }).catch(() => undefined);
					throw retryErr;
				}
			} else {
				if (uploadedFileId) await storage.deleteFile({ bucketId: BRANDING_BUCKET_ID, fileId: uploadedFileId }).catch(() => undefined);
				throw error;
			}
		}
		if (uploadedFileId && existing?.logo_file_id) await storage.deleteFile({ bucketId: BRANDING_BUCKET_ID, fileId: existing.logo_file_id }).catch((error: any) => console.warn('[Admin API] Ancien logo non supprimé:', error));
		return json(mapSettings(saved));
	} catch (error) { return responseError(error); }
};
