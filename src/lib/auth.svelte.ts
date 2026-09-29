import { account } from '$lib/appwrite';
import type { Models } from 'appwrite';
import { getOrCreateProfile, type UserProfile } from '$lib/services/profiles';
import { clearAdminSessionCache, getAdminSession } from '$lib/admin/admin-client';

class AuthState {
	user = $state<Models.User<Models.Preferences> | null>(null);
	profile = $state<UserProfile | null>(null);
	isAdmin = $state(false);
	loading = $state(true);
	showAuthModal = $state(false);
	onLoginSuccessCallback = $state<(() => void) | null>(null);

	openLogin(callback?: () => void) {
		if (callback) {
			this.onLoginSuccessCallback = callback;
		} else {
			this.onLoginSuccessCallback = null;
		}
		this.showAuthModal = true;
	}

	triggerLoginSuccess() {
		if (this.onLoginSuccessCallback) {
			const cb = this.onLoginSuccessCallback;
			this.onLoginSuccessCallback = null;
			cb();
		}
	}

	async check() {
		try {
			this.loading = true;
			const u = await account.get();
			this.user = u;
			if (u) {
				clearAdminSessionCache();
				try {
					await getAdminSession();
					this.isAdmin = true;
				} catch {
					this.isAdmin = false;
				}
				try {
					this.profile = await getOrCreateProfile(u.$id, u.name, u.email);
				} catch (pe) {
					console.warn('[AuthState] Failed to get/create profile:', pe);
				}
			} else {
				this.profile = null;
				this.isAdmin = false;
			}
		} catch {
			this.user = null;
			this.profile = null;
			this.isAdmin = false;
		} finally {
			this.loading = false;
		}
	}
}

export function translateAuthError(error: any, language: 'fr' | 'ht' = 'fr'): string {
	const rawMessage = String(error?.message || error || '');
	const msg = rawMessage.toLowerCase();
	const type = String(error?.type || '').toLowerCase();
	const messages = {
		fr: {
			password: 'Le mot de passe doit contenir au moins 8 caractères.',
			credentials: 'Adresse e-mail ou mot de passe incorrect. Vérifiez-les et réessayez.',
			alreadyExists: 'Un compte utilise déjà cette adresse e-mail. Connectez-vous ou utilisez une autre adresse.',
			rateLimit: 'Trop de tentatives en peu de temps. Veuillez patienter avant de réessayer.',
			email: 'Veuillez saisir une adresse e-mail valide.',
			expired: 'Ce lien a expiré. Demandez un nouveau lien de récupération.',
			generic: 'Une erreur est survenue. Veuillez réessayer.'
		},
		ht: {
			password: 'Modpas la dwe gen omwen 8 karaktè.',
			credentials: 'Adrès imèl la oswa modpas la pa kòrèk. Verifye yo epi eseye ankò.',
			alreadyExists: 'Gen yon kont ki itilize adrès imèl sa a deja. Konekte oswa itilize yon lòt adrès.',
			rateLimit: 'Ou fè twòp tantativ nan yon ti tan. Tanpri tann yon ti moman anvan ou eseye ankò.',
			email: 'Tanpri antre yon adrès imèl ki kòrèk.',
			expired: 'Lyen sa a ekspire. Mande yon nouvo lyen pou chanje modpas ou.',
			generic: 'Yon erè rive. Tanpri eseye ankò.'
		}
	}[language];

	if (
		msg.includes('invalid `password` param') ||
		msg.includes('password must be between 8 and 256') ||
		(msg.includes('password') && msg.includes('between 8'))
	) {
		return messages.password;
	}
	if (
		msg.includes('invalid credentials') ||
		msg.includes('invalid email or password') ||
		type.includes('user_invalid_credentials')
	) {
		return messages.credentials;
	}
	if (
		msg.includes('user with the same email already exists') ||
		msg.includes('already exists') ||
		type.includes('user_already_exists')
	) {
		return messages.alreadyExists;
	}
	if (msg.includes('rate limit') || type.includes('rate_limit')) {
		return messages.rateLimit;
	}
	if (msg.includes('invalid `email` param') || (msg.includes('email') && msg.includes('invalid'))) {
		return messages.email;
	}
	if (msg.includes('expired') || type.includes('expired')) return messages.expired;

	return messages.generic;
}

export const authState = new AuthState();
