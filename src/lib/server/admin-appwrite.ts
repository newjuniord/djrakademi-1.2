import { env } from '$env/dynamic/private';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT } from '$env/static/public';
import {
	Account,
	Client,
	ID,
	Permission,
	Query,
	Role,
	Storage,
	TablesDB,
	Teams,
	Users
} from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

export const DATABASE_ID = 'djrakademi';
export const SETTINGS_TABLE = 'platform_settings';
export const SETTINGS_ROW_ID = 'global';
export const BRANDING_BUCKET_ID = 'ebooks';

export class AdminServerError extends Error {
	constructor(message: string, public status = 500) {
		super(message);
		this.name = 'AdminServerError';
	}
}

function baseClient(): Client {
	return new Client().setEndpoint(PUBLIC_APPWRITE_ENDPOINT).setProject(PUBLIC_APPWRITE_PROJECT);
}

export async function requireAdmin(request: Request) {
	const authorization = request.headers.get('authorization') || '';
	const match = authorization.match(/^Bearer\s+(.+)$/i);
	if (!match) throw new AdminServerError('Authentification requise.', 401);

	try {
		const client = baseClient().setJWT(match[1]);
		const [user] = await Promise.all([
			new Account(client).get(),
			new Teams(client).get({ teamId: env.APPWRITE_ADMINS_TEAM_ID || 'admins' })
		]);
		return user;
	} catch {
		throw new AdminServerError('Accès administrateur refusé.', 403);
	}
}

export function adminServices() {
	const key = env.APPWRITE_API_KEY?.trim();
	if (!key) throw new AdminServerError('APPWRITE_API_KEY n’est pas configurée sur le serveur.', 503);
	const client = baseClient().setKey(key);
	return {
		tables: new TablesDB(client),
		storage: new Storage(client),
		users: new Users(client)
	};
}

export async function listAllRows(tables: TablesDB, tableId: string, queries: string[] = []) {
	const rows: any[] = [];
	let cursor: string | undefined;
	do {
		const page = await tables.listRows({
			databaseId: DATABASE_ID,
			tableId,
			queries: [...queries, Query.orderAsc('$id'), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
			total: false
		});
		rows.push(...page.rows);
		cursor = page.rows.length === 100 ? page.rows[page.rows.length - 1].$id : undefined;
	} while (cursor);
	return rows;
}

export function normalizePage(url: URL) {
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
	const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
	return { page, limit, offset: (page - 1) * limit };
}

export function mapOrder(row: any, accessGranted?: boolean) {
	return {
		id: row.$id,
		reference: `CMD-${row.$id.slice(0, 6).toUpperCase()}`,
		userId: row.user_id || undefined,
		customerName: row.customer_name || '',
		customerEmail: row.customer_email || '',
		customerPhone: row.customer_phone || undefined,
		productId: row.product_id,
		productTitle: row.product_title || '',
		type: row.product_type,
		amount: typeof row.amount === 'number' ? row.amount : 0,
		currency: row.currency || 'HTG',
		status: row.status,
		paymentProvider: row.payment_provider || undefined,
		paymentId: row.payment_id || undefined,
		createdAt: row.created_at || row.$createdAt,
		paidAt: row.paid_at || undefined,
		...(accessGranted === undefined ? {} : { accessGranted })
	};
}

export function mapAdminUser(row: any, counts = { courseCount: 0, ebookCount: 0 }) {
	return {
		id: row.user_id || row.$id,
		name: row.name || 'Utilisateur',
		email: row.email || '',
		whatsapp: row.whatsapp || undefined,
		status: row.status === 'disabled' ? 'disabled' : 'active',
		courseCount: counts.courseCount,
		ebookCount: counts.ebookCount,
		createdAt: row.created_at || row.$createdAt
	};
}

export function mapSettings(row?: any) {
	const logoFileId = row?.logo_file_id;
	const logoUrl = logoFileId
		? `${PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BRANDING_BUCKET_ID}/files/${encodeURIComponent(logoFileId)}/view?project=${encodeURIComponent(PUBLIC_APPWRITE_PROJECT)}`
		: undefined;
	return {
		siteName: row?.site_name || '',
		tagline: row?.tagline || '',
		contactEmail: row?.contact_email || '',
		whatsappNumber: row?.whatsapp_number || '',
		timezone: row?.timezone || '',
		currency: 'HTG' as const,
		logoUrl
	};
}

export async function validateLogo(file: File) {
	if (file.size > 2 * 1024 * 1024) throw new AdminServerError('Le logo ne doit pas dépasser 2 Mo.', 400);
	const bytes = new Uint8Array(await file.arrayBuffer());
	const png = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
	const jpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	const webp = bytes.length > 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
	if (!png && !jpeg && !webp) throw new AdminServerError('Le logo doit être un fichier PNG, JPG ou WEBP valide.', 400);
	const extension = png ? 'png' : jpeg ? 'jpg' : 'webp';
	return InputFile.fromBuffer(bytes, `logo.${extension}`);
}

export const publicFilePermissions = [Permission.read(Role.any())];
export { ID, Query };
