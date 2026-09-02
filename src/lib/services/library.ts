import { account } from '$lib/appwrite';
import type { Ebook } from '$lib/types/admin';
import type { Booking } from '$lib/types/coaching';

export type LibraryBooking = Booking & { serviceTitle: string; coachWhatsapp?: string };
export type CourseProgress = { completedLessonIds: string[]; lastLessonId?: string };

export async function getAccountLibrary(): Promise<{ courseIds: string[]; courseProgress: Record<string, CourseProgress>; coachWhatsapp?: string; ebooks: Ebook[]; bookings: LibraryBooking[] }> {
	const jwt = (await account.createJWT()).jwt;
	const response = await fetch('/api/account/library', { headers: { Authorization: `Bearer ${jwt}` } });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.message || 'Impossible de charger votre espace apprenant.');
	return data;
}
