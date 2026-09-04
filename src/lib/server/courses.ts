import { ID, Query, type Models } from 'node-appwrite';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';

export class CourseServerError extends Error {
	constructor(message: string, public status = 500) {
		super(message);
		this.name = 'CourseServerError';
	}
}

async function courseRows(courseId: string) {
	const { tables } = adminServices();
	let course: any;
	try {
		course = await tables.getRow({ databaseId: DATABASE_ID, tableId: 'courses', rowId: courseId });
	} catch {
		throw new CourseServerError('Formation introuvable.', 404);
	}
	const [modules, lessons] = await Promise.all([
		tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'course_modules',
			queries: [Query.equal('course_id', courseId), Query.orderAsc('order'), Query.limit(100)],
			total: false
		}),
		tables.listRows({
			databaseId: DATABASE_ID,
			tableId: 'lessons',
			queries: [Query.equal('course_id', courseId), Query.orderAsc('order'), Query.limit(500)],
			total: false
		})
	]);
	return { tables, course, modules: modules.rows, lessons: lessons.rows };
}

function mapCourse(course: any, modules: any[], lessons: any[], includeContent: boolean) {
	const vId = course.lemonsqueezy_variant_id || course.variant_id || course.variantId || '';
	const pUsd = typeof course.price_usd === 'number' ? course.price_usd : (typeof course.priceUsd === 'number' ? course.priceUsd : undefined);
	const vUrl = course.preview_video_url || course.previewVideoUrl || course.video_url || course.videoUrl || '';
	return {
		id: course.$id,
		title: course.title || '',
		description: course.description || '',
		cover: course.cover || '',
		price: Number(course.price) || 0,
		priceUsd: pUsd && pUsd > 0 ? pUsd : undefined,
		isFree: Boolean(course.is_free),
		published: Boolean(course.published),
		studentCount: Number(course.student_count) || 0,
		variantId: vId,
		lemonsqueezyVariantId: vId,
		videoUrl: vUrl || undefined,
		previewVideoUrl: vUrl || undefined,
		modules: modules.map((module) => ({
			id: module.$id,
			title: module.title || '',
			lessons: lessons.filter((lesson) => lesson.module_id === module.$id).map((lesson) => ({
				id: lesson.$id,
				title: lesson.title || '',
				type: lesson.type || 'video',
				...(includeContent ? { videoUrl: lesson.video_url || '', content: lesson.content || '' } : {})
			}))
		}))
	};
}

export async function getPublicCourseServer(courseId: string) {
	const rows = await courseRows(courseId);
	if (!rows.course.published) throw new CourseServerError('Formation introuvable.', 404);
	return mapCourse(rows.course, rows.modules, rows.lessons, false);
}

export async function hasCourseAccessServer(courseId: string, userId: string): Promise<boolean> {
	const { tables } = adminServices();
	const result = await tables.listRows({
		databaseId: DATABASE_ID,
		tableId: 'access_grants',
		queries: [
			Query.equal('user_id', userId),
			Query.equal('item_type', 'course'),
			Query.equal('item_id', courseId),
			Query.limit(1)
		],
		total: false
	});
	return result.rows.length > 0;
}

async function readCourseProgress(tables: ReturnType<typeof adminServices>['tables'], courseId: string, userId: string) {
	const result = await tables.listRows({
		databaseId: DATABASE_ID,
		tableId: 'course_progress',
		queries: [Query.equal('user_id', userId), Query.equal('course_id', courseId), Query.limit(1)],
		total: false
	});
	const row: any = result.rows[0];
	let completedLessonIds: string[] = [];
	try {
		const parsed = JSON.parse(row?.completed_lesson_ids || '[]');
		if (Array.isArray(parsed)) completedLessonIds = parsed.filter((id): id is string => typeof id === 'string');
	} catch { /* Invalid legacy progress is treated as empty. */ }
	return { completedLessonIds, lastLessonId: row?.last_lesson_id || undefined };
}

export async function getOwnedCourseServer(courseId: string, userId: string) {
	const rows = await courseRows(courseId);
	if (!rows.course.published) throw new CourseServerError('Formation introuvable.', 404);
	if (!rows.course.is_free && !(await hasCourseAccessServer(courseId, userId))) {
		throw new CourseServerError('Vous devez acheter cette formation pour accéder aux leçons.', 403);
	}
	const progress = await readCourseProgress(rows.tables, courseId, userId);
	return { ...mapCourse(rows.course, rows.modules, rows.lessons, true), progress };
}

export async function saveCourseProgressServer(courseId: string, userId: string, input: any) {
	const rows = await courseRows(courseId);
	if (!rows.course.published) throw new CourseServerError('Formation introuvable.', 404);
	if (!rows.course.is_free && !(await hasCourseAccessServer(courseId, userId))) {
		throw new CourseServerError('Vous devez acheter cette formation pour enregistrer votre progression.', 403);
	}
	const lessonIds = new Set(rows.lessons.map((lesson: any) => String(lesson.$id)));
	const requested = Array.isArray(input?.completedLessonIds) ? input.completedLessonIds : [];
	const completedLessonIds = [...new Set(requested.filter((id: unknown): id is string => typeof id === 'string' && lessonIds.has(id)))];
	if (requested.length !== completedLessonIds.length || completedLessonIds.length > 1000) {
		throw new CourseServerError('Progression invalide.', 400);
	}
	const lastLessonId = typeof input?.lastLessonId === 'string' && lessonIds.has(input.lastLessonId) ? input.lastLessonId : undefined;
	if (input?.lastLessonId && !lastLessonId) throw new CourseServerError('Dernière leçon invalide.', 400);

	const existing = await rows.tables.listRows({
		databaseId: DATABASE_ID, tableId: 'course_progress', total: false,
		queries: [Query.equal('user_id', userId), Query.equal('course_id', courseId), Query.limit(1)]
	});
	const data = { completed_lesson_ids: JSON.stringify(completedLessonIds), last_lesson_id: lastLessonId, updated_at: new Date().toISOString() };
	if (existing.rows[0]) {
		await rows.tables.updateRow({ databaseId: DATABASE_ID, tableId: 'course_progress', rowId: existing.rows[0].$id, data });
	} else {
		try {
			await rows.tables.createRow({
				databaseId: DATABASE_ID, tableId: 'course_progress', rowId: ID.unique(),
				data: { user_id: userId, course_id: courseId, ...data }
			});
		} catch (error: any) {
			if (error?.code !== 409) throw error;
			const current = await rows.tables.listRows({
				databaseId: DATABASE_ID, tableId: 'course_progress',
				queries: [Query.equal('user_id', userId), Query.equal('course_id', courseId), Query.limit(1)]
			});
			if (!current.rows[0]) throw error;
			await rows.tables.updateRow({ databaseId: DATABASE_ID, tableId: 'course_progress', rowId: current.rows[0].$id, data });
		}
	}
	return { completedLessonIds, lastLessonId };
}

export async function claimFreeCourseServer(courseId: string, user: Models.User<Models.Preferences>) {
	const { tables } = adminServices();
	let course: any;
	try {
		course = await tables.getRow({ databaseId: DATABASE_ID, tableId: 'courses', rowId: courseId });
	} catch {
		throw new CourseServerError('Formation introuvable.', 404);
	}
	if (!course.published || (!course.is_free && Number(course.price) > 0)) {
		throw new CourseServerError('Cette formation n’est pas gratuite.', 409);
	}
	if (await hasCourseAccessServer(courseId, user.$id)) return { owned: true, created: false };

	const now = new Date().toISOString();
	const transaction = await tables.createTransaction({ ttl: 60 });
	try {
		await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: 'access_grants',
			rowId: ID.unique(),
			transactionId: transaction.$id,
			data: { user_id: user.$id, item_type: 'course', item_id: courseId, granted_by: 'free', created_at: now }
		});
		await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: 'orders',
			rowId: ID.unique(),
			transactionId: transaction.$id,
			data: {
				user_id: user.$id,
				customer_name: user.name || 'Client',
				customer_email: user.email,
				product_type: 'course',
				product_id: courseId,
				product_title: course.title || 'Formation',
				amount: 0,
				currency: 'HTG',
				payment_provider: 'free',
				status: 'paid',
				created_at: now,
				paid_at: now
			}
		});
		await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
		return { owned: true, created: true };
	} catch (error: any) {
		await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
		if (error?.code === 409) return { owned: true, created: false };
		throw error;
	}
}
