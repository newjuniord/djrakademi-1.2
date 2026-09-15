import { json, type RequestHandler } from '@sveltejs/kit';
import { adminServices, DATABASE_ID, requireAdmin } from '$lib/server/admin-appwrite';
import { _bundleError, _validateBundle } from '../+server';

export const PUT: RequestHandler = async ({ request, params }) => {
	try {
		await requireAdmin(request);
		const data = await _validateBundle(await request.json());
		const { tables } = adminServices();
		await tables.updateRow({ databaseId: DATABASE_ID, tableId: 'bundles', rowId: params.id || '', data: { ...data, updated_at: new Date().toISOString() } });
		return json({ id: params.id });
	} catch (error) { return _bundleError(error); }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	try {
		await requireAdmin(request);
		const { tables } = adminServices();
		await tables.deleteRow({ databaseId: DATABASE_ID, tableId: 'bundles', rowId: params.id || '' });
		return json({ success: true });
	} catch (error) { return _bundleError(error); }
};
