import { ID, Query, type Models } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';

export class ProfileServerError extends Error {
	constructor(message: string, public status = 500) {
		super(message);
		this.name = 'ProfileServerError';
	}
}

function mapProfile(row: any) {
	return {
		id: row.$id,
		userId: row.user_id,
		name: row.name || '',
		email: row.email || '',
		whatsapp: row.whatsapp || '',
		status: row.status === 'disabled' ? 'disabled' : 'active',
		createdAt: row.created_at || row.$createdAt,
		updatedAt: row.updated_at || row.$updatedAt
	};
}

async function findProfile(userId: string) {
	const { tables } = adminServices();
	const result = await tables.listRows({
		databaseId: DATABASE_ID,
		tableId: 'profiles',
		queries: [Query.equal('user_id', userId), Query.limit(1)],
		total: false
	});
	return { tables, row: result.rows[0] as any | undefined };
}

export async function getOrCreateProfileServer(user: Models.User<Models.Preferences>) {
	const { tables, row } = await findProfile(user.$id);
	if (row) return mapProfile(row);
	const now = new Date().toISOString();
	try {
		const created = await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: 'profiles',
			rowId: ID.unique(),
			data: {
				user_id: user.$id,
				name: user.name || 'Utilisateur',
				email: user.email,
				whatsapp: '',
				status: 'active',
				created_at: now,
				updated_at: now
			}
		});
		return mapProfile(created);
	} catch (error: any) {
		if (error?.code === 409) {
			const existing = await findProfile(user.$id);
			if (existing.row) return mapProfile(existing.row);
		}
		throw error;
	}
}

export async function updateOwnedProfileServer(
	user: Models.User<Models.Preferences>,
	input: { name?: unknown; whatsapp?: unknown }
) {
	const current = await getOrCreateProfileServer(user);
	const name = input.name === undefined ? current.name : String(input.name).trim();
	const whatsapp = input.whatsapp === undefined ? current.whatsapp : String(input.whatsapp).trim();
	if (!name || name.length > 255) throw new ProfileServerError('Le nom est invalide.', 400);
	if (whatsapp.length > 16 || (whatsapp && !/^\+[1-9]\d{7,14}$/.test(whatsapp))) {
		throw new ProfileServerError('Le numéro WhatsApp doit être au format international, par exemple +50937001234.', 400);
	}
	const { tables } = adminServices();
	const updated = await tables.updateRow({
		databaseId: DATABASE_ID,
		tableId: 'profiles',
		rowId: current.id,
		data: { name, whatsapp, updated_at: new Date().toISOString() }
	});
	return mapProfile(updated);
}
