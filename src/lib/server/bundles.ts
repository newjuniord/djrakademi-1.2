import { ID, Query, type TablesDB } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';

export type BundleItem = { type: 'course' | 'ebook'; id: string };

export function parseBundleItems(value: unknown): BundleItem[] {
	let parsed: unknown = value;
	if (typeof value === 'string') {
		try { parsed = JSON.parse(value); } catch { parsed = [value]; }
	}
	if (!Array.isArray(parsed)) return [];
	const seen = new Set<string>();
	const items: BundleItem[] = [];
	for (const raw of parsed) {
		if (typeof raw === 'string') {
			const parts = raw.split(':');
			const type = parts[0];
			const id = parts.slice(1).join(':').trim();
			if ((type === 'course' || type === 'ebook') && id) {
				const key = `${type}:${id}`;
				if (!seen.has(key)) {
					seen.add(key);
					items.push({ type, id });
				}
			}
		} else if (raw && typeof raw === 'object') {
			const type = (raw as any).type;
			const id = String((raw as any).id || '').trim();
			if ((type === 'course' || type === 'ebook') && id) {
				const key = `${type}:${id}`;
				if (!seen.has(key)) {
					seen.add(key);
					items.push({ type, id });
				}
			}
		}
	}
	return items;
}

export async function bundleContents(tables: TablesDB, items: BundleItem[]) {
	return Promise.all(items.map(async (item) => {
		const row: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: item.type === 'course' ? 'courses' : 'ebooks', rowId: item.id });
		let modules: Array<{ id: string; title: string; lessons: Array<{ id: string; title: string; type: string }> }> = [];
		if (item.type === 'course') {
			try {
				const [modulesRes, lessonsRes] = await Promise.all([
					tables.listRows({
						databaseId: DATABASE_ID,
						tableId: 'course_modules',
						queries: [Query.equal('course_id', item.id), Query.orderAsc('order'), Query.limit(100)],
						total: false
					}),
					tables.listRows({
						databaseId: DATABASE_ID,
						tableId: 'lessons',
						queries: [Query.equal('course_id', item.id), Query.orderAsc('order'), Query.limit(500)],
						total: false
					})
				]);
				modules = modulesRes.rows.map((m: any) => ({
					id: m.$id,
					title: String(m.title || ''),
					lessons: lessonsRes.rows
						.filter((l: any) => (l.module_id || l.moduleId) === m.$id)
						.map((l: any) => ({
							id: l.$id,
							title: String(l.title || ''),
							type: String(l.type || 'video')
						}))
				}));
			} catch {
				modules = [];
			}
		}
		return {
			...item,
			title: String(row.title || ''),
			cover: item.type === 'course' ? String(row.cover || '') : row.cover_file_id ? `/api/ebooks/${encodeURIComponent(item.id)}/cover` : '',
			price: Number(row.price) || 0,
			published: Boolean(row.published),
			...(item.type === 'course' ? { modules } : {})
		};
	}));
}

export async function getBundle(id: string, publishedOnly = true) {
	const { tables } = adminServices();
	const row: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: 'bundles', rowId: id });
	if (publishedOnly && !row.published) return null;
	const items = parseBundleItems(row.items_json);
	const contents = await bundleContents(tables, items);
	if (publishedOnly && (!contents.length || contents.some((item) => !item.published))) return null;
	return {
		id: row.$id,
		title: String(row.title || ''),
		description: String(row.description || ''),
		cover: String(row.cover_url || '') || contents[0]?.cover || '',
		price: Number(row.price) || 0,
		priceUsd: Number(row.price_usd) || 0,
		variantId: String(row.variant_id || ''),
		published: Boolean(row.published),
		items: contents,
		originalPrice: contents.reduce((sum, item) => sum + item.price, 0),
		createdAt: row.created_at || row.$createdAt
	};
}

export async function listBundles(publishedOnly = true) {
	const { tables } = adminServices();
	const rows = await tables.listRows({
		databaseId: DATABASE_ID, tableId: 'bundles',
		queries: [...(publishedOnly ? [Query.equal('published', true)] : []), Query.orderDesc('created_at'), Query.limit(100)]
	});
	const bundles = await Promise.all(rows.rows.map((row: any) => getBundle(row.$id, publishedOnly).catch(() => null)));
	return bundles.filter((bundle): bundle is NonNullable<typeof bundle> => bundle !== null);
}

export async function grantBundleAccess(
	tables: TablesDB,
	order: any,
	userId: string,
	transactionId?: string
) {
	let items = parseBundleItems(order.bundle_items_json);
	if (!items.length) {
		const bundleId = String(order.product_id || '').trim();
		if (!bundleId) throw new Error('La commande du bundle ne contient aucun identifiant de bundle.');
		// Historical orders may predate the bundle_items_json snapshot.
		const bundle = await getBundle(bundleId, false);
		items = bundle?.items.map(({ type, id }) => ({ type, id })) || [];
	}
	if (!items.length) throw new Error('La commande du bundle ne contient aucun produit.');
	for (const item of items) {
		const existing = await tables.listRows({
			databaseId: DATABASE_ID, tableId: 'access_grants', transactionId,
			queries: [Query.equal('user_id', userId), Query.equal('item_type', item.type), Query.equal('item_id', item.id), Query.limit(1)]
		});
		if (existing.rows.length) continue;
		await tables.createRow({
			databaseId: DATABASE_ID, tableId: 'access_grants', rowId: ID.unique(), transactionId,
			data: { user_id: userId, item_type: item.type, item_id: item.id, granted_by: 'purchase', created_at: new Date().toISOString() }
		});
	}
}
