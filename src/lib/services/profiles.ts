import { account } from '$lib/appwrite';

export interface UserProfile {
	id: string;
	userId: string;
	name: string;
	email: string;
	whatsapp: string;
	status: 'active' | 'disabled';
	createdAt: string;
	updatedAt: string;
}

async function profileJwt(): Promise<string> {
	return (await account.createJWT()).jwt;
}

async function profileRequest(init: RequestInit = {}): Promise<UserProfile> {
	const jwt = await profileJwt();
	const response = await fetch('/api/account/profile', {
		...init,
		headers: {
			Accept: 'application/json',
			Authorization: `Bearer ${jwt}`,
			...(init.body ? { 'Content-Type': 'application/json' } : {}),
			...(init.headers || {})
		}
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.message || 'Impossible de charger le profil.');
	return data as UserProfile;
}

export async function getProfileByUserId(_userId: string): Promise<UserProfile | null> {
	try {
		return await profileRequest();
	} catch (error) {
		console.warn('[Profile] Chargement impossible:', error);
		return null;
	}
}

export async function getProfileById(userId: string): Promise<UserProfile | null> {
	return getProfileByUserId(userId);
}

export async function createProfile(_data: {
	userId: string;
	name: string;
	email: string;
	whatsapp?: string;
	status?: 'active' | 'disabled';
}): Promise<UserProfile> {
	return profileRequest();
}

export async function getOrCreateProfile(
	_userId: string,
	_name: string,
	_email: string,
	_whatsapp = ''
): Promise<UserProfile> {
	return profileRequest();
}

export async function updateProfile(
	_userId: string,
	data: { name?: string; whatsapp?: string; status?: 'active' | 'disabled' }
): Promise<UserProfile> {
	const updated = await profileRequest({
		method: 'PATCH',
		body: JSON.stringify({ name: data.name, whatsapp: data.whatsapp })
	});
	if (data.name) {
		await account.updateName(data.name).catch((error) =>
			console.warn('[Profile] Nom Appwrite Auth non mis à jour:', error)
		);
	}
	return updated;
}

export async function getAllProfiles(): Promise<UserProfile[]> {
	throw new Error('Utilisez l’API administrateur pour lister les profils.');
}

export async function updateProfileStatus(): Promise<UserProfile | null> {
	throw new Error('Utilisez l’API administrateur pour modifier le statut d’un profil.');
}
