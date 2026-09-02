import { account } from '$lib/appwrite';

async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
	const jwt = (await account.createJWT()).jwt;
	return fetch(endpoint, { ...options, headers: { Authorization: `Bearer ${jwt}`, ...(options.headers || {}) } });
}

export async function ownsEbook(ebookId: string): Promise<boolean> {
	const response = await authenticatedFetch(`/api/ebooks/${encodeURIComponent(ebookId)}/access`);
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.message || "Vérification impossible.");
	return Boolean(data.owned);
}

export async function claimFreeEbook(ebookId: string): Promise<void> {
	const response = await authenticatedFetch(`/api/ebooks/${encodeURIComponent(ebookId)}/claim`, { method: 'POST' });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.message || 'Impossible de débloquer cet ebook.');
}

export async function downloadOwnedEbook(ebookId: string): Promise<void> {
	const response = await authenticatedFetch(`/api/ebooks/${encodeURIComponent(ebookId)}/download`);
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.message || 'Téléchargement impossible.');
	}
	const blob = await response.blob();
	const disposition = response.headers.get('content-disposition') || '';
	const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || 'ebook.pdf';
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
