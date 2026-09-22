<script lang="ts">
	import { X, Mail, Lock, User as UserIcon, Phone, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-svelte';
	import { page } from '$app/state';
	import { account, ID } from '$lib/appwrite';
	import { authState, translateAuthError } from '$lib/auth.svelte';
	import { getOrCreateProfile, updateProfile } from '$lib/services/profiles';

	let { isOpen = $bindable(false), onLogin, initialView = "login" } = $props<{
		isOpen: boolean;
		onLogin: () => void;
		initialView?: "login" | "signup";
	}>();

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			closeModal: 'Fermer la fenêtre d\'authentification',
			loginHeading: 'Ravi de vous revoir !',
			signupHeading: 'Créer un compte',
			forgotHeading: 'Mot de passe oublié',
			loginSub: 'Connectez-vous pour accéder à vos formations et outils.',
			signupSub: 'Rejoignez DJR Akademi et développez vos compétences.',
			forgotSub: 'Entrez votre email pour réinitialiser votre mot de passe.',
			fullNameLabel: 'Nom complet',
			fullNamePlaceholder: 'Jean Pierre',
			phoneLabel: 'Numéro de téléphone',
			phonePlaceholder: '+509 00 00 0000',
			emailLabel: 'Adresse email',
			emailPlaceholder: 'jean@exemple.com',
			passwordLabel: 'Mot de passe',
			forgotPassBtn: 'Oublié ?',
			passwordPlaceholder: '••••••••',
			hidePassword: 'Masquer le mot de passe',
			showPassword: 'Afficher le mot de passe',
			loadingText: 'Veuillez patienter...',
			loginSubmit: 'Se connecter',
			signupSubmit: 'Créer mon compte',
			forgotSubmit: 'Envoyer le lien',
			noAccountText: 'Vous n\'avez pas de compte ?',
			signupAction: 'S\'inscrire',
			hasAccountText: 'Vous avez déjà un compte ?',
			loginAction: 'Se connecter',
			rememberPassText: 'Je me souviens de mon mot de passe.',
			backToLoginAction: 'Retour à la connexion'
		},
		ht: {
			closeModal: 'Fermer la fenêtre d\'authentification',
			loginHeading: 'Mèsi paske ou tounen !',
			signupHeading: 'Kreye yon kont',
			forgotHeading: 'Mo de pas bliye',
			loginSub: 'Konekte pou w ka jwenn aksè ak fòmasyon ak zouti ou yo.',
			signupSub: 'Rebòne DJR Akademi epi devlope konpetans ou.',
			forgotSub: 'Antre imèl ou pou w ka chanje mo de pas ou.',
			fullNameLabel: 'Non konplè',
			fullNamePlaceholder: 'Jean Dupont',
			phoneLabel: 'Nimewo telefòn',
			phonePlaceholder: '+509 00 00 0000',
			emailLabel: 'Adrès imèl',
			emailPlaceholder: 'jean@exemple.com',
			passwordLabel: 'Mo de pas',
			forgotPassBtn: 'Bliye ?',
			passwordPlaceholder: '••••••••',
			hidePassword: 'Kache mo de pas a',
			showPassword: 'Montre mo de pas a',
			loadingText: 'Tanpri tann yon ti moman...',
			loginSubmit: 'Konekte',
			signupSubmit: 'Kreye kont mwen',
			forgotSubmit: 'Voye lyen an',
			noAccountText: 'Ou poko gen yon kont ?',
			signupAction: 'Enskri',
			hasAccountText: 'Ou gen yon kont deja ?',
			loginAction: 'Konekte',
			rememberPassText: 'Mwen sonje mo de pas mwen an.',
			backToLoginAction: 'Tounen nan koneksyon'
		}
	};
	let t = $derived(i18n[currentLang]);

	// 'login' | 'signup' | 'forgot'
	let view = $state<'login' | 'signup' | 'forgot'>('login');
	
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	$effect(() => {
		if (isOpen) {
			view = initialView;
			errorMessage = null;
			successMessage = null;
			showPassword = false;
		}
	});

	function close() {
		isOpen = false;
		setTimeout(() => {
			view = 'login'; // Reset view after closing
			errorMessage = null;
			successMessage = null;
			name = '';
			phone = '';
			email = '';
			password = '';
			showPassword = false;
		}, 300);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			close();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMessage = null;
		successMessage = null;

		if (view === 'login') {
			try {
				loading = true;
				await account.createEmailPasswordSession(email, password);
				const user = await account.get();
				if (user) {
					authState.user = user;
					try {
						authState.profile = await getOrCreateProfile(user.$id, user.name, user.email);
					} catch (pe) {
						console.warn('[AuthModal] Profile fetch warning:', pe);
					}
					close();
					onLogin();
				}
			} catch (error: any) {
				errorMessage = translateAuthError(error);
			} finally {
				loading = false;
			}
		} else if (view === 'signup') {
			try {
				loading = true;
				// Create account
				await account.create(ID.unique(), email, password, name);
				// Automatically log in
				await account.createEmailPasswordSession(email, password);
				// Fetch user and set global state
				const user = await account.get();
				if (user) {
					authState.user = user;
					// Automatically create user profile document in Appwrite profiles collection
					try {
						await getOrCreateProfile(user.$id, name, email);
						authState.profile = await updateProfile(user.$id, { whatsapp: phone.trim() });
					} catch (pe) {
						console.warn('[AuthModal] Profile creation warning:', pe);
					}
					close();
					onLogin();
				}
			} catch (error: any) {
				errorMessage = translateAuthError(error);
			} finally {
				loading = false;
			}
		} else {
			try {
				loading = true;
				const response = await fetch('/api/account/recovery/request', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});
				const result = await response.json().catch(() => ({}));
				if (!response.ok) throw new Error(result.message || 'Impossible d’envoyer le lien de récupération.');
				successMessage = result.message;
			} catch (error: any) {
				errorMessage = translateAuthError(error);
			} finally {
				loading = false;
			}
		}
	}
	
	function switchView(newView: 'login' | 'signup' | 'forgot') {
		view = newView;
		errorMessage = null;
		successMessage = null;
		showPassword = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<button
		type="button"
		onclick={close}
		class="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity cursor-default"
		aria-label={t.closeModal}
	></button>

	<!-- Modal Content -->
	<div class="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
		<div class="w-full max-w-md bg-white text-zinc-950 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200 border border-zinc-200">
			<!-- Modal Header -->
			<div class="p-6 pb-0 flex items-center justify-between">
				<div class="size-10 bg-amber-400/20 text-amber-500 rounded-xl grid place-items-center">
					<Lock size={20} />
				</div>
				<button
					type="button"
					onclick={close}
					class="size-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 grid place-items-center transition-colors"
				>
					<X size={18} />
				</button>
			</div>

			<div class="p-6 sm:p-8 pt-6">
				<!-- Dynamic Header Text -->
				<div class="mb-8">
					<h2 class="text-2xl font-black tracking-tight mb-2">
						{#if view === 'login'}
							{t.loginHeading}
						{:else if view === 'signup'}
							{t.signupHeading}
						{:else}
							{t.forgotHeading}
						{/if}
					</h2>
					<p class="text-zinc-500 text-sm font-medium">
						{#if view === 'login'}
							{t.loginSub}
						{:else if view === 'signup'}
							{t.signupSub}
						{:else}
							{t.forgotSub}
						{/if}
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-4">
					{#if view === 'signup'}
						<div class="space-y-1.5">
							<label for="name" class="text-xs font-bold text-zinc-700 ml-1">{t.fullNameLabel}</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
									<UserIcon size={16} />
								</div>
								<input
									id="name"
									type="text"
									required
									bind:value={name}
									disabled={loading}
									class="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all disabled:opacity-60"
									placeholder={t.fullNamePlaceholder}
								/>
							</div>
						</div>
						<div class="space-y-1.5">
							<label for="signup-phone" class="text-xs font-bold text-zinc-700 ml-1">{t.phoneLabel}</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
									<Phone size={16} />
								</div>
								<input
									id="signup-phone"
									type="tel"
									autocomplete="tel"
									required
									bind:value={phone}
									disabled={loading}
									class="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all disabled:opacity-60"
									placeholder={t.phonePlaceholder}
								/>
							</div>
						</div>
					{/if}

					<div class="space-y-1.5">
						<label for="email" class="text-xs font-bold text-zinc-700 ml-1">{t.emailLabel}</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
								<Mail size={16} />
							</div>
							<input
								id="email"
								type="email"
								required
								bind:value={email}
								disabled={loading}
								class="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all disabled:opacity-60"
								placeholder={t.emailPlaceholder}
							/>
						</div>
					</div>

					{#if view !== 'forgot'}
						<div class="space-y-1.5">
							<div class="flex items-center justify-between ml-1">
								<label for="password" class="text-xs font-bold text-zinc-700">{t.passwordLabel}</label>
								{#if view === 'login'}
									<button
										type="button"
										onclick={() => (view = 'forgot')}
										class="text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors"
									>
										{t.forgotPassBtn}
									</button>
								{/if}
							</div>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
									<Lock size={16} />
								</div>
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									required
									bind:value={password}
									disabled={loading}
									class="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-11 pr-11 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all disabled:opacity-60"
									placeholder={t.passwordPlaceholder}
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									disabled={loading}
									class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 focus:outline-none transition-colors disabled:opacity-50"
									aria-label={showPassword ? t.hidePassword : t.showPassword}
									aria-pressed={showPassword}
								>
									{#if showPassword}
										<EyeOff size={18} />
									{:else}
										<Eye size={18} />
									{/if}
								</button>
							</div>
						</div>
					{/if}

					{#if errorMessage}
						<div class="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2 animate-fade-in border border-red-100">
							<AlertCircle size={14} class="shrink-0 mt-0.5" />
							<span>{errorMessage}</span>
						</div>
					{/if}
					{#if successMessage}
						<div class="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-100">
							{successMessage}
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
					>
						{#if loading}
							<Loader2 size={16} class="animate-spin" />
							{t.loadingText}
						{:else if view === 'login'}
							{t.loginSubmit} <ArrowRight size={16} />
						{:else if view === 'signup'}
							{t.signupSubmit} <ArrowRight size={16} />
						{:else}
							{t.forgotSubmit}
						{/if}
					</button>
				</form>

				<!-- Toggle Views -->
				<div class="mt-6 text-center text-xs font-medium text-zinc-500">
					{#if view === 'login'}
						{t.noAccountText}
						<button
							type="button"
							onclick={() => switchView('signup')}
							disabled={loading}
							class="text-amber-500 font-bold hover:underline disabled:opacity-60"
						>
							{t.signupAction}
						</button>
					{:else if view === 'signup'}
						{t.hasAccountText}
						<button
							type="button"
							onclick={() => switchView('login')}
							disabled={loading}
							class="text-amber-500 font-bold hover:underline disabled:opacity-60"
						>
							{t.loginAction}
						</button>
					{:else}
						{t.rememberPassText}
						<button
							type="button"
							onclick={() => switchView('login')}
							disabled={loading}
							class="text-amber-500 font-bold hover:underline disabled:opacity-60"
						>
							{t.backToLoginAction}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
