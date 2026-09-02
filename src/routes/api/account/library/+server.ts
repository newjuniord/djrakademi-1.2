import { json, type RequestHandler } from '@sveltejs/kit';
import { Query } from 'node-appwrite';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { mapBooking } from '$lib/server/bookings';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const user = await requirePaymentUser(request);
		const { tables } = adminServices();
		const [grants, bookings, progressRows] = await Promise.all([
			tables.listRows({
				databaseId: DATABASE_ID, tableId: 'access_grants',
				queries: [Query.equal('user_id', user.$id), Query.limit(100)]
			}),
			tables.listRows({
				databaseId: DATABASE_ID, tableId: 'bookings',
				queries: [Query.equal('user_id', user.$id), Query.orderDesc('created_at'), Query.limit(100)]
			}),
			tables.listRows({
				databaseId: DATABASE_ID, tableId: 'course_progress',
				queries: [Query.equal('user_id', user.$id), Query.limit(100)]
			})
		]);
		const courseIds = grants.rows.filter((row: any) => row.item_type === 'course').map((row: any) => row.item_id);
		const ebookIds = grants.rows.filter((row: any) => row.item_type === 'ebook').map((row: any) => row.item_id);
		const ebookRows = await Promise.all(ebookIds.map((id: string) =>
			tables.getRow({ databaseId: DATABASE_ID, tableId: 'ebooks', rowId: id }).catch(() => null)
		));
		const serviceIds = [...new Set(bookings.rows.map((row: any) => row.service_id).filter(Boolean))] as string[];
		const [serviceRows, settingsResult] = await Promise.all([
			Promise.all(serviceIds.map((id) =>
				tables.getRow({ databaseId: DATABASE_ID, tableId: 'coaching_services', rowId: id }).catch(() => null)
			)),
			tables.listRows({
				databaseId: DATABASE_ID, tableId: 'coaching_settings',
				queries: [Query.limit(1)]
			}).catch(() => ({ rows: [] }))
		]);
		const serviceTitles = new Map(serviceRows.filter(Boolean).map((row: any) => [row.$id, row.title]));
		const coachWhatsapp = settingsResult.rows[0]?.whatsapp || '+50937000000';
		const courseProgress = Object.fromEntries(progressRows.rows.map((row: any) => {
			let completedLessonIds: string[] = [];
			try { completedLessonIds = JSON.parse(row.completed_lesson_ids || '[]'); } catch { /* Empty progress. */ }
			return [row.course_id, { completedLessonIds, lastLessonId: row.last_lesson_id || undefined }];
		}));
		return json({
			courseIds,
			courseProgress,
			coachWhatsapp,
			ebooks: ebookRows.filter(Boolean).map((row: any) => ({
				id: row.$id,
				title: row.title || '',
				description: row.description || '',
				cover: row.cover_file_id ? `/api/ebooks/${encodeURIComponent(row.$id)}/cover` : '',
				price: Number(row.price) || 0,
				isFree: Boolean(row.is_free),
				published: Boolean(row.published),
				salesCount: Number(row.sales_count) || 0
			})),
			bookings: bookings.rows.map((row: any) => ({
				...mapBooking(row),
				serviceTitle: serviceTitles.get(row.service_id) || 'Coaching individuel',
				coachWhatsapp
			}))
		});
	} catch (error) {
		const status = error instanceof PaymentServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Impossible de charger votre espace.' }, { status });
	}
};
