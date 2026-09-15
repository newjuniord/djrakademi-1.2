import { json, type RequestHandler } from '@sveltejs/kit';
import { ID } from 'node-appwrite';
import { adminServices, DATABASE_ID, requireAdmin } from '$lib/server/admin-appwrite';
import { bundleContents, listBundles, parseBundleItems } from '$lib/server/bundles';

export function _bundleError(error: unknown) {
	const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500;
	return json({ message: error instanceof Error ? error.message : 'Erreur serveur.' }, { status });
}

export async function _validateBundle(body: any) {
	const title = String(body?.title || '').trim();
	const description = String(body?.description || '').trim();
	const coverUrl = String(body?.coverUrl || '').trim();
	const variantId = String(body?.variantId || '').trim();
	const price = Number(body?.price);
	const priceUsd = Number(body?.priceUsd || 0);
	const published = Boolean(body?.published);
	const items = parseBundleItems(body?.items);
	if (!title || title.length > 255 || !description) throw Object.assign(new Error('Titre et description requis.'), { status: 400 });
	if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(priceUsd) || priceUsd < 0) throw Object.assign(new Error('Prix du bundle invalide.'), { status: 400 });
	if (items.length < 2 || items.length > 30) throw Object.assign(new Error('Choisissez entre 2 et 30 formations ou e-books.'), { status: 400 });
	if (coverUrl && (!/^https:\/\//i.test(coverUrl) || coverUrl.length > 2048)) throw Object.assign(new Error('La couverture doit être une URL HTTPS.'), { status: 400 });
	if (variantId.length > 100) throw Object.assign(new Error('Identifiant de variante trop long.'), { status: 400 });
	const { tables } = adminServices();
	let contents;
	try { contents = await bundleContents(tables, items); }
	catch { throw Object.assign(new Error('Un des produits sélectionnés est introuvable.'), { status: 400 }); }
	if (published && contents.some((item) => !item.published)) throw Object.assign(new Error('Publiez tous les produits inclus avant de publier ce bundle.'), { status: 400 });
	return { title, description, cover_url: coverUrl || undefined, price, price_usd: priceUsd || undefined, variant_id: variantId || undefined, published, items_json: JSON.stringify(items) };
}

export const GET: RequestHandler = async ({ request }) => {
	try { await requireAdmin(request); return json({ bundles: await listBundles(false) }); }
	catch (error) { return _bundleError(error); }
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		await requireAdmin(request);
		const data = await _validateBundle(await request.json());
		const { tables } = adminServices();
		const now = new Date().toISOString();
		const row = await tables.createRow({ databaseId: DATABASE_ID, tableId: 'bundles', rowId: ID.unique(), data: { ...data, created_at: now, updated_at: now } });
		return json({ id: row.$id }, { status: 201 });
	} catch (error) { return _bundleError(error); }
};
