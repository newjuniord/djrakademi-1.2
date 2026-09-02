import { json, type RequestHandler } from '@sveltejs/kit';
import { Account, Client } from 'node-appwrite';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT } from '$env/static/public';
import { adminServices } from '$lib/server/admin-appwrite';

export const POST: RequestHandler = async ({ request }) => {
	let body: { userId?: unknown; secret?: unknown; password?: unknown };
	try { body = await request.json(); } catch {
		return json({ message: 'Données de récupération invalides.' }, { status: 400 });
	}
	const userId = String(body.userId || '').trim();
	const secret = String(body.secret || '').trim();
	const password = String(body.password || '');
	if (!userId || !secret) return json({ message: 'Le lien de récupération est incomplet.' }, { status: 400 });
	if (password.length < 8 || password.length > 256) {
		return json({ message: 'Le mot de passe doit contenir entre 8 et 256 caractères.' }, { status: 400 });
	}

	let sessionId: string | undefined;
	try {
		const publicClient = new Client().setEndpoint(PUBLIC_APPWRITE_ENDPOINT).setProject(PUBLIC_APPWRITE_PROJECT);
		const session = await new Account(publicClient).createSession({ userId, secret });
		sessionId = session.$id;
		const { users } = adminServices();
		await users.updatePassword({ userId, password });
		await users.deleteSessions({ userId });
		return json({ success: true });
	} catch (error: any) {
		if (sessionId) {
			await adminServices().users.deleteSession({ userId, sessionId }).catch(() => undefined);
		}
		console.warn('[Password recovery complete]:', error?.type || error?.code || 'unknown');
		const invalidToken = error?.code === 401 || error?.type === 'user_invalid_token' || error?.type === 'user_invalid_credentials';
		return json(
			{ message: invalidToken ? 'Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien de récupération.' : 'Impossible de modifier le mot de passe pour le moment.' },
			{ status: invalidToken ? 401 : 500 }
		);
	}
};
