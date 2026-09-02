import { account } from '$lib/appwrite';
import type { Models } from 'appwrite';
import { getOrCreateProfile, type UserProfile } from '$lib/services/profiles';
import { clearAdminSessionCache, getAdminSession } from '$lib/admin/admin-client';

class AuthState {
	user = $state<Models.User<Models.Preferences> | null>(null);
	profile = $state<UserProfile | null>(null);
	isAdmin = $state(false);
	loading = $state(true);

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

export const authState = new AuthState();
