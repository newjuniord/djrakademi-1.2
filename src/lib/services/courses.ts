import { tables, databases, storage, Query, ID, DATABASE_ID } from '$lib/appwrite';
import { account } from '$lib/appwrite';
import type { Course, CourseModule, Lesson } from '$lib/types/admin';

export const COURSES_COLLECTION = 'courses';
export const MODULES_COLLECTION = 'course_modules';
export const LESSONS_COLLECTION = 'lessons';
export const STORAGE_BUCKET_ID = 'ebooks';

/**
 * Compress an image file to a Data URL guaranteed to fit Appwrite string attribute (<= 64,000 bytes)
 */
async function compressImageToDataUrl(file: File, maxDimension = 800, quality = 0.7): Promise<string> {
	if (typeof window === 'undefined') return '';
	return new Promise((resolve) => {
		const img = new Image();
		const reader = new FileReader();
		reader.onload = (e) => {
			img.src = e.target?.result as string;
		};
		img.onload = () => {
			const canvas = document.createElement('canvas');
			let { width, height } = img;
			if (width > height) {
				if (width > maxDimension) {
					height = Math.round((height * maxDimension) / width);
					width = maxDimension;
				}
			} else {
				if (height > maxDimension) {
					width = Math.round((width * maxDimension) / height);
					height = maxDimension;
				}
			}
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(img, 0, 0, width, height);
				let dataUrl = canvas.toDataURL('image/jpeg', quality);
				if (dataUrl.length > 64000) {
					dataUrl = canvas.toDataURL('image/jpeg', 0.4);
				}
				return resolve(dataUrl.slice(0, 64000));
			}
			resolve((reader.result as string || '').slice(0, 64000));
		};
		img.onerror = () => {
			resolve('');
		};
		reader.readAsDataURL(file);
	});
}

/**
 * Upload a course cover image file to Appwrite Storage and return its public URL
 */
export async function uploadCourseCover(file: File): Promise<string> {
	try {
		const result = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file);
		const viewUrl: any = storage.getFileView(STORAGE_BUCKET_ID, result.$id);
		const urlString = typeof viewUrl === 'string' ? viewUrl : viewUrl?.href || String(viewUrl);
		return urlString.slice(0, 64000);
	} catch (error) {
		console.warn('[Appwrite Courses Service] Storage upload failed, fallback to compressed Data URL:', error);
		return await compressImageToDataUrl(file);
	}
}

// Map Appwrite document to Course object
function mapCourseDoc(doc: any, modules: CourseModule[] = []): Course {
	return {
		id: doc.$id,
		title: doc.title || '',
		description: doc.description || '',
		cover: doc.cover || '',
		price: typeof doc.price === 'number' ? doc.price : 0,
		isFree: Boolean(doc.is_free ?? doc.isFree),
		published: Boolean(doc.published),
		studentCount: typeof doc.student_count === 'number'
			? doc.student_count
			: typeof doc.studentCount === 'number'
				? doc.studentCount
				: 0,
		modules
	};
}

// Fetch all courses from Appwrite
export async function getCourses(): Promise<Course[]> {
	try {
		const res: any = await tables.listRows(DATABASE_ID, COURSES_COLLECTION, [Query.limit(100)]);
		const list = res.rows || res.documents || [];
		return list.map((doc: any) => mapCourseDoc(doc));
	} catch (error) {
		throw error;
	}
}

// Fetch published courses from Appwrite for public view
export async function getPublishedCourses(): Promise<Course[]> {
	try {
		const res: any = await tables.listRows(DATABASE_ID, COURSES_COLLECTION, [Query.equal('published', true), Query.limit(100)]);
		const list = res.rows || res.documents || [];
		return list.map((doc: any) => mapCourseDoc(doc));
	} catch (error) {
		throw error;
	}
}

async function courseApiRequest<T>(endpoint: string, authenticated = false, init: RequestInit = {}): Promise<T> {
	const response = await fetch(endpoint, {
		...init,
		headers: {
			Accept: 'application/json',
			...(authenticated ? { Authorization: `Bearer ${(await account.createJWT()).jwt}` } : {}),
			...(init.headers || {})
		}
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.message || 'Impossible de charger la formation.');
	return data as T;
}

export async function getCourseById(courseId: string): Promise<Course | null> {
	try {
		return await courseApiRequest<Course>(`/api/courses/${encodeURIComponent(courseId)}`);
	} catch (error) {
		console.warn(`[Courses] Formation publique ${courseId} introuvable:`, error);
		return null;
	}
}

export function getOwnedCourseById(courseId: string): Promise<Course> {
	return courseApiRequest<Course>(`/api/courses/${encodeURIComponent(courseId)}/learn`, true);
}

export function saveCourseProgress(
	courseId: string,
	progress: { completedLessonIds: string[]; lastLessonId?: string }
): Promise<{ completedLessonIds: string[]; lastLessonId?: string }> {
	return courseApiRequest(`/api/courses/${encodeURIComponent(courseId)}/learn`, true, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(progress)
	});
}

export async function hasCourseAccess(courseId: string): Promise<boolean> {
	const result = await courseApiRequest<{ owned: boolean }>(`/api/courses/${encodeURIComponent(courseId)}/access`, true);
	return result.owned;
}

export function claimFreeCourse(courseId: string): Promise<{ owned: boolean; created: boolean }> {
	return courseApiRequest(`/api/courses/${encodeURIComponent(courseId)}/claim`, true, { method: 'POST' });
}

// Fetch a complete course directly for authenticated administrators.
export async function getAdminCourseById(courseId: string): Promise<Course | null> {
	try {
		// 1. Fetch Course Document
		let courseDoc: any;
		try {
			courseDoc = await tables.getRow(DATABASE_ID, COURSES_COLLECTION, courseId);
		} catch (e) {
			courseDoc = await databases.getDocument(DATABASE_ID, COURSES_COLLECTION, courseId);
		}

		// 2. Fetch Modules
		let moduleDocs: any[] = [];
		try {
			let modRes: any;
			try {
				modRes = await tables.listRows(DATABASE_ID, MODULES_COLLECTION, [
					Query.equal('course_id', courseId),
					Query.limit(100)
				]);
			} catch (e) {
				modRes = await databases.listDocuments(DATABASE_ID, MODULES_COLLECTION, [
					Query.equal('course_id', courseId),
					Query.limit(100)
				]);
			}
			moduleDocs = (modRes.rows || modRes.documents || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
		} catch (e) {
			console.warn('[Appwrite Courses Service] Could not fetch modules:', e);
		}

		// 3. Fetch Lessons
		let lessonDocs: any[] = [];
		try {
			let lesRes: any;
			try {
				lesRes = await tables.listRows(DATABASE_ID, LESSONS_COLLECTION, [
					Query.equal('course_id', courseId),
					Query.limit(500)
				]);
			} catch (e) {
				lesRes = await databases.listDocuments(DATABASE_ID, LESSONS_COLLECTION, [
					Query.equal('course_id', courseId),
					Query.limit(500)
				]);
			}
			lessonDocs = (lesRes.rows || lesRes.documents || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
		} catch (e) {
			console.warn('[Appwrite Courses Service] Could not fetch lessons:', e);
		}

		// Assemble modules and lessons
		const modules: CourseModule[] = moduleDocs.map((mDoc) => {
			const mLessons: Lesson[] = lessonDocs
				.filter((lDoc) => (lDoc.module_id || lDoc.moduleId) === mDoc.$id)
				.map((lDoc) => ({
					id: lDoc.$id,
					title: lDoc.title || '',
					type: lDoc.type || 'video',
					videoUrl: lDoc.video_url || lDoc.videoUrl || '',
					content: lDoc.content || ''
				}));

			return {
				id: mDoc.$id,
				title: mDoc.title || '',
				lessons: mLessons
			};
		});

		return mapCourseDoc(courseDoc, modules);
	} catch (error) {
		console.warn(`[Appwrite Courses Service] Course ${courseId} not found in Appwrite:`, error);
		return null;
	}
}

function validatedCoursePrice(data: Partial<Course>): number {
	if (data.isFree) return 0;
	const price = Number(data.price);
	if (!Number.isInteger(price) || price < 100 || price > 100000) {
		throw new Error('Le prix du cours doit être un montant entier compris entre 100 et 100 000 HTG.');
	}
	return price;
}

// Create a new course in Appwrite
export async function createCourse(data: Partial<Course>, coverFile?: File | null): Promise<Course> {
	try {
		const coursePrice = validatedCoursePrice(data);
		let coverUrl = data.cover || '';
		if (coverFile) {
			try {
				coverUrl = await uploadCourseCover(coverFile);
			} catch (e) {
				console.error('[Appwrite Courses Service] Cover file upload failed:', e);
			}
		}

		const payload = {
			title: data.title || 'Nouveau cours',
			description: data.description || '',
			cover: (coverUrl || '').slice(0, 64000),
			price: coursePrice,
			is_free: Boolean(data.isFree),
			published: Boolean(data.published),
			student_count: data.studentCount ?? 0
		};

		const doc: any = await tables.createRow(DATABASE_ID, COURSES_COLLECTION, ID.unique(), payload);

		const createdCourse = mapCourseDoc(doc, []);

		// If initial modules were supplied, save them as well
		if (data.modules && data.modules.length > 0) {
			await saveCourseCurriculum(createdCourse.id, data.modules);
			return (await getAdminCourseById(createdCourse.id)) || createdCourse;
		}

		return createdCourse;
	} catch (error: any) {
		console.error('[Appwrite Courses Service] Detailed Appwrite error during course creation:', {
			message: error?.message,
			code: error?.code,
			type: error?.type,
			error
		});
		if (typeof window !== 'undefined' && error?.code === 401) {
			console.warn('Appwrite permission error: Please ensure collection "courses" has create permissions enabled in Appwrite Console.');
		}
		throw error;
	}
}

// Update an existing course's metadata in Appwrite
export async function updateCourse(courseId: string, data: Partial<Course>, coverFile?: File | null): Promise<void> {
	try {
		const payload: Record<string, any> = {};
		const coursePrice = data.price !== undefined ? validatedCoursePrice(data) : data.isFree ? 0 : undefined;
		if (data.title !== undefined) payload.title = data.title;
		if (data.description !== undefined) payload.description = data.description;
		if (coursePrice !== undefined) payload.price = coursePrice;
		if (data.isFree !== undefined) {
			payload.is_free = Boolean(data.isFree);
		}
		if (data.published !== undefined) payload.published = Boolean(data.published);

		if (coverFile) {
			try {
				const uploaded = await uploadCourseCover(coverFile);
				payload.cover = (uploaded || '').slice(0, 64000);
			} catch (e) {
				console.error('[Appwrite Courses Service] Cover upload during update failed:', e);
			}
		} else if (data.cover !== undefined) {
			payload.cover = (data.cover || '').slice(0, 64000);
		}

		await tables.updateRow(DATABASE_ID, COURSES_COLLECTION, courseId, payload);
	} catch (error) {
		console.error(`[Appwrite Courses Service] Error updating course :`, error);
		throw error;
	}
}

// Delete a course and its modules/lessons from Appwrite
export async function deleteCourse(courseId: string): Promise<void> {
	try {
		// Clean up associated modules and lessons
		try {
			const modRes = await tables.listRows(DATABASE_ID, MODULES_COLLECTION, [
				Query.equal('course_id', courseId)
			]);
			for (const modDoc of modRes.rows) {
				await tables.deleteRow(DATABASE_ID, MODULES_COLLECTION, modDoc.$id);
			}
		} catch (e) {}

		try {
			const lesRes = await tables.listRows(DATABASE_ID, LESSONS_COLLECTION, [
				Query.equal('course_id', courseId)
			]);
			for (const lDoc of lesRes.rows) {
				await tables.deleteRow(DATABASE_ID, LESSONS_COLLECTION, lDoc.$id);
			}
		} catch (e) {}

		await tables.deleteRow(DATABASE_ID, COURSES_COLLECTION, courseId);
	} catch (error) {
		console.error(`[Appwrite Courses Service] Error deleting course :`, error);
		throw error;
	}
}

// Synchronize course modules and lessons with Appwrite
export async function saveCourseCurriculum(
	courseId: string,
	modules: CourseModule[]
): Promise<void> {
	// Try Server Admin API first for maximum reliability & zero permission issues
	try {
		const { account } = await import('$lib/appwrite');
		const jwt = (await account.createJWT()).jwt;
		const response = await fetch(`/api/admin/courses/${courseId}/curriculum`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${jwt}`
			},
			body: JSON.stringify({ modules })
		});
		if (response.ok) {
			const resData = await response.json();
			if (resData.modules && Array.isArray(resData.modules)) {
				for (let i = 0; i < resData.modules.length; i++) {
					if (modules[i]) {
						modules[i].id = resData.modules[i].id;
						for (let j = 0; j < (resData.modules[i].lessons || []).length; j++) {
							if (modules[i].lessons[j]) {
								modules[i].lessons[j].id = resData.modules[i].lessons[j].id;
							}
						}
					}
				}
			}
			return;
		}
	} catch (error) {
		console.warn('[Appwrite Courses Service] Server API curriculum save fallback to client SDK:', error);
	}

	try {
		let existingMods: any[] = [];
		let existingLessons: any[] = [];

		try {
			const mRes = await tables.listRows(DATABASE_ID, MODULES_COLLECTION, [
				Query.equal('course_id', courseId)
			]);
			existingMods = mRes.rows;
		} catch (e) {}

		try {
			const lRes = await tables.listRows(DATABASE_ID, LESSONS_COLLECTION, [
				Query.equal('course_id', courseId)
			]);
			existingLessons = lRes.rows;
		} catch (e) {}

		const currentModIds = new Set<string>();
		const currentLessonIds = new Set<string>();

		for (let mIdx = 0; mIdx < modules.length; mIdx++) {
			const mod = modules[mIdx];
			let modAppwriteId = mod.id;

			const isExistingMod = existingMods.some((m) => m.$id === mod.id);

			if (isExistingMod) {
				await tables.updateRow(DATABASE_ID, MODULES_COLLECTION, mod.id, {
					title: mod.title,
					order: mIdx
				});
				currentModIds.add(mod.id);
			} else {
				const newModDoc = await tables.createRow(
					DATABASE_ID,
					MODULES_COLLECTION,
					ID.unique(),
					{
						course_id: courseId,
						title: mod.title,
						order: mIdx
					}
				);
				modAppwriteId = newModDoc.$id;
				mod.id = modAppwriteId;
				currentModIds.add(modAppwriteId);
			}

			for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
				const lesson = mod.lessons[lIdx];
				const isExistingLesson = existingLessons.some((l) => l.$id === lesson.id);

				if (isExistingLesson) {
					await tables.updateRow(DATABASE_ID, LESSONS_COLLECTION, lesson.id, {
						course_id: courseId,
						module_id: modAppwriteId,
						title: lesson.title,
						type: lesson.type,
						video_url: lesson.videoUrl || '',
						content: lesson.content || '',
						order: lIdx
					});
					currentLessonIds.add(lesson.id);
				} else {
					const newLessonDoc = await tables.createRow(
						DATABASE_ID,
						LESSONS_COLLECTION,
						ID.unique(),
						{
							course_id: courseId,
							module_id: modAppwriteId,
							title: lesson.title,
							type: lesson.type,
							video_url: lesson.videoUrl || '',
							content: lesson.content || '',
							order: lIdx
						}
					);
					lesson.id = newLessonDoc.$id;
					currentLessonIds.add(newLessonDoc.$id);
				}
			}
		}

		for (const oldMod of existingMods) {
			if (!currentModIds.has(oldMod.$id)) {
				await tables.deleteRow(DATABASE_ID, MODULES_COLLECTION, oldMod.$id).catch(() => undefined);
			}
		}

		for (const oldLesson of existingLessons) {
			if (!currentLessonIds.has(oldLesson.$id)) {
				await tables.deleteRow(DATABASE_ID, LESSONS_COLLECTION, oldLesson.$id).catch(() => undefined);
			}
		}
	} catch (error) {
		console.error(`[Appwrite Courses Service] Error saving curriculum for course ${courseId}:`, error);
		throw error;
	}
}
