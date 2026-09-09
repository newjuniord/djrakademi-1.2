import { json, type RequestHandler } from '@sveltejs/kit';
import { ID, Query } from 'node-appwrite';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { mapBooking } from '$lib/server/bookings';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const user = await requirePaymentUser(request);
		const { tables } = adminServices();
		const [grantsRes, bookings, progressRows, userPaidOrders, emailPaidOrders] = await Promise.all([
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
			}),
			tables.listRows({
				databaseId: DATABASE_ID, tableId: 'orders',
				queries: [Query.equal('user_id', user.$id), Query.equal('status', 'paid'), Query.limit(100)]
			}).catch(() => ({ rows: [] })),
			user.email ? tables.listRows({
				databaseId: DATABASE_ID, tableId: 'orders',
				queries: [Query.equal('customer_email', user.email.trim().toLowerCase()), Query.equal('status', 'paid'), Query.limit(100)]
			}).catch(() => ({ rows: [] })) : Promise.resolve({ rows: [] })
		]);

		const grants: any[] = [...grantsRes.rows];
		const allPaidOrdersMap = new Map<string, any>();
		for (const o of [...userPaidOrders.rows, ...emailPaidOrders.rows]) {
			allPaidOrdersMap.set(o.$id, o);
		}

		for (const orderRow of allPaidOrdersMap.values()) {
			if (orderRow.product_id) {
				if (orderRow.product_type === 'course' || orderRow.product_type === 'ebook') {
					const hasGrant = grants.some(
						(g: any) => g.item_type === orderRow.product_type && g.item_id === orderRow.product_id
					);
					if (!hasGrant) {
						const newGrant = await tables.createRow({
							databaseId: DATABASE_ID,
							tableId: 'access_grants',
							rowId: ID.unique(),
							data: {
								user_id: user.$id,
								item_type: orderRow.product_type,
								item_id: orderRow.product_id,
								granted_by: 'library_auto_heal',
								created_at: new Date().toISOString()
							}
						}).catch(() => null);

						if (newGrant) {
							grants.push(newGrant);
						} else {
							grants.push({
								$id: ID.unique(),
								user_id: user.$id,
								item_type: orderRow.product_type,
								item_id: orderRow.product_id
							});
						}

						if (!orderRow.user_id || orderRow.user_id === 'admin') {
							await tables.updateRow({
								databaseId: DATABASE_ID,
								tableId: 'orders',
								rowId: orderRow.$id,
								data: { user_id: user.$id }
							}).catch(() => undefined);
						}
					}
				} else if (orderRow.product_type === 'coaching') {
					const bookingRow = bookings.rows.find((b: any) => b.$id === orderRow.product_id);
					if (bookingRow && (bookingRow.status === 'pending_payment' || bookingRow.payment_status === 'pending')) {
						await tables.updateRow({
							databaseId: DATABASE_ID,
							tableId: 'bookings',
							rowId: bookingRow.$id,
							data: {
								status: 'confirmed',
								payment_status: 'paid',
								hold_expires_at: null,
								updated_at: new Date().toISOString()
							}
						}).catch(() => undefined);
						bookingRow.status = 'confirmed';
						bookingRow.payment_status = 'paid';
					}
				}
			}
		}

		const courseIds = grants.filter((row: any) => row.item_type === 'course').map((row: any) => row.item_id);
		const ebookIds = grants.filter((row: any) => row.item_type === 'ebook').map((row: any) => row.item_id);
		const ebookRows = await Promise.all(ebookIds.map((id: string) =>
			tables.getRow({ databaseId: DATABASE_ID, tableId: 'ebooks', rowId: id }).catch(() => null)
		));

		const paidBookings = bookings.rows.filter((row: any) => {
			const isConfirmed = row.status === 'confirmed' || row.status === 'completed' || row.payment_status === 'paid' || row.payment_status === 'not_required';
			const isPending = row.status === 'pending_payment' || row.payment_status === 'pending' || row.status === 'cancelled' || row.payment_status === 'failed';
			return isConfirmed && !isPending;
		});

		const serviceIds = [...new Set(paidBookings.map((row: any) => row.service_id).filter(Boolean))] as string[];
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
			bookings: paidBookings.map((row: any) => ({
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

