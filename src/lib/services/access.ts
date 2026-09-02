import { tables, DATABASE_ID } from '$lib/appwrite';
import { ID, Query } from 'appwrite';

export const COLLECTION_ACCESS_GRANTS = 'access_grants';

export interface AccessGrant {
	id: string;
	userId: string;
	itemType: 'course' | 'ebook';
	itemId: string;
	grantedBy: 'purchase' | 'admin' | 'free';
	createdAt: string;
}

export function mapAccessGrantDoc(doc: any): AccessGrant {
	return {
		id: doc.$id,
		userId: doc.user_id || '',
		itemType: doc.item_type || 'course',
		itemId: doc.item_id || '',
		grantedBy: doc.granted_by || 'purchase',
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString()
	};
}

export async function grantAccess(
	userId: string,
	itemType: 'course' | 'ebook',
	itemId: string,
	grantedBy: 'purchase' | 'admin' | 'free' = 'purchase'
): Promise<AccessGrant> {
	// First check if already granted
	const existing = await hasUserAccess(userId, itemType, itemId);
	if (existing) {
		return existing;
	}

	const now = new Date().toISOString();
	const doc = await tables.createRow(
		DATABASE_ID,
		COLLECTION_ACCESS_GRANTS,
		ID.unique(),
		{
			user_id: userId,
			item_type: itemType,
			item_id: itemId,
			granted_by: grantedBy,
			created_at: now,
		}
	);
	return mapAccessGrantDoc(doc);
}

export async function getUserAccessGrants(
	userId: string,
	itemType?: 'course' | 'ebook'
): Promise<AccessGrant[]> {
	try {
		const queries = [Query.equal('user_id', userId)];
		if (itemType) queries.push(Query.equal('item_type', itemType));
		const res = await tables.listRows(DATABASE_ID, COLLECTION_ACCESS_GRANTS, queries);
		return res.rows.map((doc: any) => mapAccessGrantDoc(doc));
	} catch (e) {
		console.warn(`[AccessService] Failed to get access grants for ${userId}:`, e);
		return [];
	}
}

export async function hasUserAccess(
	userId: string,
	itemType: 'course' | 'ebook',
	itemId: string
): Promise<AccessGrant | null> {
	try {
		const res = await tables.listRows(DATABASE_ID, COLLECTION_ACCESS_GRANTS, [
			Query.equal('user_id', userId),
			Query.equal('item_type', itemType),
			Query.equal('item_id', itemId)
		]);
		if (res.rows.length > 0) {
			return mapAccessGrantDoc(res.rows[0]);
		}
		return null;
	} catch (e) {
		console.warn(`[AccessService] Check access error:`, e);
		return null;
	}
}
