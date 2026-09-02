import { ID, Query, type Models } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';

const EBOOKS_TABLE = 'ebooks';
const ACCESS_TABLE = 'access_grants';
const ORDERS_TABLE = 'orders';
const BUCKET_ID = 'ebooks';

export class EbookServerError extends Error {
	constructor(message: string, public status = 500) {
		super(message);
		this.name = 'EbookServerError';
	}
}

function safeFilename(value: string): string {
	const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
	return (normalized.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'ebook') + '.pdf';
}

export async function hasEbookAccessServer(ebookId: string, userId: string): Promise<boolean> {
	const { tables } = adminServices();
	const result = await tables.listRows({
		databaseId: DATABASE_ID, tableId: ACCESS_TABLE,
		queries: [Query.equal("user_id", userId), Query.equal("item_type", "ebook"), Query.equal("item_id", ebookId), Query.limit(1)]
	});
	return result.rows.length > 0;
}

export async function claimFreeEbookServer(ebookId: string, user: Models.User<Models.Preferences>) {
	const { tables } = adminServices();
	const transaction = await tables.createTransaction({ ttl: 60 });
	try {
		const ebook: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: EBOOKS_TABLE, rowId: ebookId, transactionId: transaction.$id });
		if (!ebook.published) throw new EbookServerError('Cet ebook n’est pas disponible.', 404);
		if (!ebook.is_free && Number(ebook.price) > 0) throw new EbookServerError('Cet ebook nécessite un paiement.', 409);
		const existing = await tables.listRows({
			databaseId: DATABASE_ID, tableId: ACCESS_TABLE, transactionId: transaction.$id,
			queries: [Query.equal('user_id', user.$id), Query.equal('item_type', 'ebook'), Query.equal('item_id', ebookId), Query.limit(1)]
		});
		if (existing.rows.length) {
			await tables.updateTransaction({ transactionId: transaction.$id, rollback: true });
			return { success: true, alreadyOwned: true };
		}
		const now = new Date().toISOString();
		await tables.createRow({
			databaseId: DATABASE_ID, tableId: ACCESS_TABLE, rowId: ID.unique(), transactionId: transaction.$id,
			data: { user_id: user.$id, item_type: 'ebook', item_id: ebookId, granted_by: 'free', created_at: now }
		});
		await tables.createRow({
			databaseId: DATABASE_ID, tableId: ORDERS_TABLE, rowId: ID.unique(), transactionId: transaction.$id,
			data: {
				user_id: user.$id, customer_name: user.name || 'Client', customer_email: user.email,
				product_type: 'ebook', product_id: ebookId, product_title: String(ebook.title || 'Ebook'), amount: 0,
				currency: 'HTG', payment_provider: 'free', status: 'paid', created_at: now, paid_at: now
			}
		});
		await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
		return { success: true, alreadyOwned: false };
	} catch (error) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		if (error instanceof EbookServerError) throw error;
		if ((error as any)?.code === 404) throw new EbookServerError('Ebook introuvable.', 404);
		if ((error as any)?.code === 409) return { success: true, alreadyOwned: true };
		throw error;
	}
}

export async function getEbookFileServer(ebookId: string, userId: string) {
	const { tables, storage } = adminServices();
	let ebook: any;
	try { ebook = await tables.getRow({ databaseId: DATABASE_ID, tableId: EBOOKS_TABLE, rowId: ebookId }); }
	catch { throw new EbookServerError('Ebook introuvable.', 404); }
	const access = await tables.listRows({
		databaseId: DATABASE_ID, tableId: ACCESS_TABLE,
		queries: [Query.equal('user_id', userId), Query.equal('item_type', 'ebook'), Query.equal('item_id', ebookId), Query.limit(1)]
	});
	if (!access.rows.length) throw new EbookServerError('Vous ne possédez pas cet ebook.', 403);
	if (!ebook.pdf_file_id) throw new EbookServerError('Le fichier PDF n’est pas encore disponible.', 404);
	try {
		const [file, bytes] = await Promise.all([
			storage.getFile({ bucketId: BUCKET_ID, fileId: ebook.pdf_file_id }),
			storage.getFileDownload({ bucketId: BUCKET_ID, fileId: ebook.pdf_file_id })
		]);
		return { bytes, mimeType: file.mimeType || 'application/pdf', filename: safeFilename(String(ebook.title || file.name || 'ebook')) };
	} catch {
		throw new EbookServerError('Impossible de récupérer le fichier PDF.', 502);
	}
}

export async function getEbookCoverServer(ebookId: string) {
	const { tables, storage } = adminServices();
	let ebook: any;
	try { ebook = await tables.getRow({ databaseId: DATABASE_ID, tableId: EBOOKS_TABLE, rowId: ebookId }); }
	catch { throw new EbookServerError('Ebook introuvable.', 404); }
	if (!ebook.cover_file_id) throw new EbookServerError('Couverture introuvable.', 404);
	try {
		const [file, bytes] = await Promise.all([
			storage.getFile({ bucketId: BUCKET_ID, fileId: ebook.cover_file_id }),
			storage.getFileView({ bucketId: BUCKET_ID, fileId: ebook.cover_file_id })
		]);
		return { bytes, mimeType: file.mimeType || 'image/jpeg' };
	} catch {
		throw new EbookServerError('Couverture introuvable.', 404);
	}
}
