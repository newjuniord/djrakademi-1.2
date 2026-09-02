import { tables, databases, storage, Query, ID, DATABASE_ID } from '$lib/appwrite';
import type { Ebook } from '$lib/types/admin';

export const EBOOKS_COLLECTION = 'ebooks';
export const EBOOKS_BUCKET_ID = 'ebooks';

/**
 * Get full HTTP URL for a file stored in Appwrite Storage
 */
export function getStorageFileUrl(fileId?: string): string | undefined {
	if (!fileId) return undefined;
	try {
		const result: any = storage.getFileView(EBOOKS_BUCKET_ID, fileId);
		return typeof result === 'string' ? result : result?.href || String(result);
	} catch (e) {
		console.warn(`[Appwrite Ebooks] Could not generate URL for fileId ${fileId}:`, e);
		return undefined;
	}
}

/**
 * Map Appwrite document to Ebook object
 */
export function mapEbookDoc(doc: any): Ebook {
	const coverFileId = doc.cover_file_id;
	const pdfFileId = doc.pdf_file_id;
	const coverUrl = coverFileId ? `/api/ebooks/${encodeURIComponent(doc.$id)}/cover` : doc.cover || '';
	const pdfUrl: undefined = undefined;

	return {
		id: doc.$id,
		title: doc.title || '',
		description: doc.description || '',
		cover: coverUrl,
		coverFileId: coverFileId || undefined,
		pdfFileId: pdfFileId || undefined,
		pdfUrl,
		fileName: pdfFileId ? `ebook-${pdfFileId.slice(0, 8)}.pdf` : undefined,
		price: typeof doc.price === 'number' ? doc.price : 0,
		isFree: Boolean(doc.is_free),
		published: Boolean(doc.published),
		salesCount: typeof doc.sales_count === 'number' ? doc.sales_count : 0,
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString(),
		updatedAt: doc.updated_at || doc.$updatedAt || new Date().toISOString()
	};
}

/**
 * Upload a file to Appwrite Storage bucket
 */
export async function uploadEbookFile(file: File): Promise<string> {
	const result = await storage.createFile(EBOOKS_BUCKET_ID, ID.unique(), file);
	return result.$id;
}

/**
 * Delete a file from Appwrite Storage bucket
 */
export async function deleteEbookFile(fileId: string): Promise<void> {
	try {
		await storage.deleteFile(EBOOKS_BUCKET_ID, fileId);
	} catch (e) {
		console.warn(`[Appwrite Ebooks] Failed to delete file ${fileId}:`, e);
	}
}

/**
 * Fetch all ebooks (Admin view)
 */
export async function getEbooks(): Promise<Ebook[]> {
	try {
		const res: any = await tables.listRows(DATABASE_ID, EBOOKS_COLLECTION, [Query.orderDesc('$createdAt'), Query.limit(100)]);
		const list = res.rows || res.documents || [];
		return list.map((doc: any) => mapEbookDoc(doc));
	} catch (error) {
		throw error;
	}
}

/**
 * Fetch published ebooks (Public catalog & home page view)
 */
export async function getPublishedEbooks(): Promise<Ebook[]> {
	try {
		const res: any = await tables.listRows(DATABASE_ID, EBOOKS_COLLECTION, [Query.equal('published', true), Query.orderDesc('$createdAt'), Query.limit(100)]);
		const list = res.rows || res.documents || [];
		return list.map((doc: any) => mapEbookDoc(doc));
	} catch (error) {
		throw error;
	}
}

/**
 * Fetch a single ebook by ID
 */
export async function getEbookById(ebookId: string): Promise<Ebook | null> {
	try {
		let doc: any;
		try {
			doc = await tables.getRow(DATABASE_ID, EBOOKS_COLLECTION, ebookId);
		} catch (e) {
			doc = await databases.getDocument(DATABASE_ID, EBOOKS_COLLECTION, ebookId);
		}
		return mapEbookDoc(doc);
	} catch (error) {
		console.warn(`[Appwrite Ebooks Service] Could not fetch ebook ${ebookId} from Appwrite:`, error);
		return null;
	}
}

/**
 * Create a new Ebook with optional file uploads
 */
export async function createEbook(
	data: {
		title: string;
		description: string;
		price: number;
		isFree: boolean;
		published: boolean;
	},
	coverFile?: File | null,
	pdfFile?: File | null
): Promise<Ebook> {
	let coverFileId: string | undefined = undefined;
	let pdfFileId: string | undefined = undefined;

	if (coverFile) {
		try {
			coverFileId = await uploadEbookFile(coverFile);
		} catch (e: any) {
			console.warn("[Appwrite Ebooks Service] Cover file upload failed (Storage bucket 'ebooks' missing or restricted):", e?.message || e);
		}
	}

	if (pdfFile) {
		try {
			pdfFileId = await uploadEbookFile(pdfFile);
		} catch (e: any) {
			console.warn("[Appwrite Ebooks Service] PDF file upload failed (Storage bucket 'ebooks' missing or restricted):", e?.message || e);
		}
	}

	const now = new Date().toISOString();
	const payload: Record<string, any> = {
		title: data.title || 'Nouvel Ebook',
		description: data.description || '',
		price: typeof data.price === 'number' ? Math.max(0, data.price) : 0,
		is_free: Boolean(data.isFree),
		published: Boolean(data.published),
		sales_count: 0,
		created_at: now,
		updated_at: now
	};

	if (coverFileId) payload.cover_file_id = coverFileId;
	if (pdfFileId) payload.pdf_file_id = pdfFileId;

	let doc: any;
	try {
		doc = await tables.createRow(DATABASE_ID, EBOOKS_COLLECTION, ID.unique(), payload);
	} catch (e: any) {
		console.warn('[Appwrite Ebooks Service] tables.createRow failed, trying databases.createDocument:', e?.message || e);
		try {
			doc = await databases.createDocument(DATABASE_ID, EBOOKS_COLLECTION, ID.unique(), payload);
		} catch (dbErr: any) {
			console.error('[Appwrite Ebooks Service] Failed to create ebook document in Appwrite:', dbErr);
			throw new Error(dbErr?.message || e?.message || "Erreur lors de la création de l'ebook dans Appwrite.");
		}
	}

	return mapEbookDoc(doc);
}

/**
 * Update an existing Ebook
 */
export async function updateEbook(
	ebookId: string,
	data: {
		title: string;
		description: string;
		price: number;
		isFree: boolean;
		published: boolean;
	},
	coverFile?: File | null,
	pdfFile?: File | null
): Promise<Ebook> {
	let existingDoc: any = null;
	try {
		existingDoc = await tables.getRow(DATABASE_ID, EBOOKS_COLLECTION, ebookId);
	} catch (e) {
		try {
			existingDoc = await databases.getDocument(DATABASE_ID, EBOOKS_COLLECTION, ebookId);
		} catch (err) {}
	}

	let coverFileId = existingDoc?.cover_file_id;
	let pdfFileId = existingDoc?.pdf_file_id;

	if (coverFile) {
		try {
			const newCoverFileId = await uploadEbookFile(coverFile);
			if (coverFileId) {
				await deleteEbookFile(coverFileId);
			}
			coverFileId = newCoverFileId;
		} catch (e: any) {
			console.warn("[Appwrite Ebooks Service] Cover file replace failed:", e?.message || e);
		}
	}

	if (pdfFile) {
		try {
			const newPdfFileId = await uploadEbookFile(pdfFile);
			if (pdfFileId) {
				await deleteEbookFile(pdfFileId);
			}
			pdfFileId = newPdfFileId;
		} catch (e: any) {
			console.warn("[Appwrite Ebooks Service] PDF file replace failed:", e?.message || e);
		}
	}

	const payload: Record<string, any> = {
		title: data.title || 'Ebook',
		description: data.description || '',
		price: typeof data.price === 'number' ? Math.max(0, data.price) : 0,
		is_free: Boolean(data.isFree),
		published: Boolean(data.published),
		updated_at: new Date().toISOString()
	};

	if (coverFileId) payload.cover_file_id = coverFileId;
	if (pdfFileId) payload.pdf_file_id = pdfFileId;

	let updatedDoc: any;
	try {
		updatedDoc = await tables.updateRow(DATABASE_ID, EBOOKS_COLLECTION, ebookId, payload);
	} catch (e: any) {
		console.warn('[Appwrite Ebooks Service] tables.updateRow failed, trying databases.updateDocument:', e?.message || e);
		try {
			updatedDoc = await databases.updateDocument(DATABASE_ID, EBOOKS_COLLECTION, ebookId, payload);
		} catch (dbErr: any) {
			console.error('[Appwrite Ebooks Service] Failed to update ebook document in Appwrite:', dbErr);
			throw new Error(dbErr?.message || e?.message || "Erreur lors de la mise à jour de l'ebook.");
		}
	}

	return mapEbookDoc(updatedDoc);
}

/**
 * Delete an Ebook and its files from Storage
 */
export async function deleteEbook(ebookId: string): Promise<void> {
	try {
		const doc = await tables.getRow(DATABASE_ID, EBOOKS_COLLECTION, ebookId);
		if (doc.cover_file_id) {
			await deleteEbookFile(doc.cover_file_id);
		}
		if (doc.pdf_file_id) {
			await deleteEbookFile(doc.pdf_file_id);
		}
	} catch (e) {
		console.warn(`[Appwrite Ebooks Service] File cleanup for ebook ${ebookId} skipped/failed:`, e);
	}

	await tables.deleteRow(DATABASE_ID, EBOOKS_COLLECTION, ebookId);
}
