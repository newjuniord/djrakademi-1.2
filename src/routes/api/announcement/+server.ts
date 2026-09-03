import { json, type RequestHandler } from '@sveltejs/kit';
import { adminServices, DATABASE_ID, SETTINGS_ROW_ID, SETTINGS_TABLE } from '$lib/server/admin-appwrite';

export const GET: RequestHandler = async () => {
	try {
		const { tables } = adminServices();
		const row: any = await tables.getRow({
			databaseId: DATABASE_ID,
			tableId: SETTINGS_TABLE,
			rowId: SETTINGS_ROW_ID
		}).catch(() => null);

		if (!row) {
			return json({ enabled: false, text: '', textColor: 'blanc', bgColor: 'noir' });
		}

		return json(
			{
				enabled: Boolean(row.announcement_enabled),
				text: row.announcement_text || '',
				textColor: row.announcement_text_color || 'blanc',
				bgColor: row.announcement_bg_color || 'noir'
			},
			{ headers: { 'cache-control': 'no-store' } }
		);
	} catch (error) {
		console.error('[Announcement API Error]:', error);
		return json({ enabled: false, text: '', textColor: 'blanc', bgColor: 'noir' });
	}
};
