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

export function translateAuthError(error: any): string {
	const rawMessage = String(error?.message || error || '');
	const msg = rawMessage.toLowerCase();
	const type = String(error?.type || '').toLowerCase();

	if (
		msg.includes('invalid `password` param') ||
		msg.includes('password must be between 8 and 256') ||
		(msg.includes('password') && msg.includes('between 8'))
	) {
		return 'Modpas la dwe gen ant 8 ak 256 karaktè.';
	}
	if (
		msg.includes('invalid credentials') ||
		msg.includes('invalid email or password') ||
		type.includes('user_invalid_credentials')
	) {
		return 'Imel oubyen modpas sa a pa bon. Tanpri tcheke yo epi eseye ankò.';
	}
	if (
		msg.includes('user with the same email already exists') ||
		msg.includes('already exists') ||
		type.includes('user_already_exists')
	) {
		return 'Yon kont gen imel sa a deja. Tanpri konekte oubyen sèvi ak yon lòt imel.';
	}
	if (msg.includes('rate limit') || type.includes('rate_limit')) {
		return 'Ou fè twòp tentativ nan yon ti tan. Tanpri tann yon ti moman anvan ou eseye ankò.';
	}
	if (msg.includes('invalid `email` param') || (msg.includes('email') && msg.includes('invalid'))) {
		return 'Tanpri antre yon adres imel ki valab.';
	}

	return rawMessage || 'Yon erè rive. Tanpri eseye ankò.';
}

export const authState = new AuthState();
