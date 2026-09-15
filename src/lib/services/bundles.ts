export type BundleItemLesson = {
	id: string;
	title: string;
	type: string;
};

export type BundleItemModule = {
	id: string;
	title: string;
	lessons: BundleItemLesson[];
};

export type BundleItem = {
	type: 'course' | 'ebook';
	id: string;
	title: string;
	cover: string;
	price: number;
	published: boolean;
	modules?: BundleItemModule[];
};
export type Bundle = {
	id: string;
	title: string;
	description: string;
	cover: string;
	price: number;
	priceUsd: number;
	variantId: string;
	published: boolean;
	items: BundleItem[];
	originalPrice: number;
	createdAt: string;
};

export async function getPublishedBundles(): Promise<Bundle[]> {
	const response = await fetch('/api/bundles');
	if (!response.ok) throw new Error('Impossible de charger les bundles.');
	return (await response.json()).bundles || [];
}

export async function getBundleById(id: string): Promise<Bundle | null> {
	const response = await fetch(`/api/bundles/${encodeURIComponent(id)}`);
	if (response.status === 404) return null;
	if (!response.ok) throw new Error('Impossible de charger ce bundle.');
	return (await response.json()).bundle || null;
}

import { getAccountLibrary } from '$lib/services/library';

export async function ownsBundle(bundle: Bundle): Promise<boolean> {
	if (!bundle || !bundle.items || bundle.items.length === 0) return false;
	try {
		const library = await getAccountLibrary();
		const ownedCourseSet = new Set(library.courseIds || []);
		const ownedEbookSet = new Set((library.ebooks || []).map((e) => e.id));

		return bundle.items.every((item) => {
			if (item.type === 'course') {
				return ownedCourseSet.has(item.id);
			}
			if (item.type === 'ebook') {
				return ownedEbookSet.has(item.id);
			}
			return false;
		});
	} catch (error) {
		console.warn('[Bundles] Error checking bundle ownership:', error);
		return false;
	}
}

