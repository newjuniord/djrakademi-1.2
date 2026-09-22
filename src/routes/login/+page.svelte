<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authState, translateAuthError } from '$lib/auth.svelte';
	import { account, ID } from '$lib/appwrite';
	import { getOrCreateProfile } from '$lib/services/profiles';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { Lock, Mail, User as UserIcon, ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			pageTitleLogin: 'Connexion · DJR Akademi',
			pageTitleSignup: 'Créer un compte · DJR Akademi',
			metaDesc: 'Connectez-vous à votre compte DJR Akademi pour accéder à vos formations.',
			headingLogin: 'Se connecter à votre compte',
			headingSignup: 'Créer votre compte DJR Akademi',
			subLogin: 'Entrez votre email et mot de passe pour continuer.',
			subSignup: 'Remplissez vos informations pour commencer.',
			tabLogin: 'Connexion',
			tabSignup: 'Inscription',
			fullNameLabel: 'Nom complet',
			fullNamePlaceholder: 'Jean Pierre',
			emailLabel: 'Adresse Email',
			emailPlaceholder: 'vous@exemple.com',
			passwordLabel: 'Mot de passe',
			passwordPlaceholder: '••••••••',
			hidePassword: 'Masquer le mot de passe',
			showPassword: 'Afficher le mot de passe',
			loadingText: 'Veuillez patienter…',
			submitLogin: 'Se connecter maintenant',
			submitSignup: 'Créer mon compte'
		},
		ht: {
			pageTitleLogin: 'Konekte · DJR Akademi',
			pageTitleSignup: 'Kreye yon kont · DJR Akademi',
			metaDesc: 'Konekte sou kont DJR Akademi ou an pou w jwenn aksè nan fòmasyon w yo.',
			headingLogin: 'Konekte sou kont ou',
			headingSignup: 'Kreye kont DJR Akademi ou',
			subLogin: 'Antre imel ak modpas ou pou w kontinye.',
			subSignup: 'Ranpli enfòmasyon w yo pou w kòmanse.',
			tabLogin: 'Koneksyon',
			tabSignup: 'Enskripsyon',
			fullNameLabel: 'Non konplè',
			fullNamePlaceholder: 'Jan Batis',
			emailLabel: 'Adrès Imèl',
			emailPlaceholder: 'ou@egzanp.com',
			passwordLabel: 'Modpas',
			passwordPlaceholder: '••••••••',
			hidePassword: 'Kache modpas la',
			showPassword: 'Montre modpas la',
			loadingText: 'Tanpri mezon…',
			submitLogin: 'Konekte kounye a',
			submitSignup: 'Kreye kont mwen'
		}
	};
	let t = $derived(i18n[currentLang]);

	let redirectTarget = $derived(page.url.searchParams.get('redirect') || (currentLang === 'ht' ? '/dashboard?lang=ht' : '/dashboard'));

	let mode = $state<'login' | 'signup'>('login');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		if (!authState.loading && authState.user) {
			goto(redirectTarget);
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = null;
		loading = true;

		try {
			if (mode === 'login') {
				await account.createEmailPasswordSession(email, password);
				const u = await account.get();
				if (u) {
					authState.user = u;
					try {
						authState.profile = await getOrCreateProfile(u.$id, u.name, u.email);
					} catch (pe) {
						console.warn('[LoginPage] Profile error:', pe);
					}
					await goto(redirectTarget);
				}
			} else {
				await account.create(ID.unique(), email, password, name);
				await account.createEmailPasswordSession(email, password);
				const u = await account.get();
				if (u) {
					authState.user = u;
					try {
						authState.profile = await getOrCreateProfile(u.$id, name, email);
					} catch (pe) {
						console.warn('[LoginPage] Profile creation error:', pe);
					}
					await goto(redirectTarget);
				}
			}
		} catch (err: any) {
			console.error('[LoginPage] Auth error:', err);
			errorMessage = translateAuthError(err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? t.pageTitleLogin : t.pageTitleSignup}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	<main class="flex-1 flex items-center justify-center p-4 py-12 sm:py-16">
		<div class="w-full max-w-md bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xl space-y-6">

			<div class="text-center space-y-2">
				<div class="size-12 bg-amber-400 text-black font-black rounded-2xl grid place-items-center mx-auto shadow-md">
					<Lock size={22} />
				</div>
				<h1 class="text-2xl font-black tracking-tight text-zinc-950">
					{mode === 'login' ? t.headingLogin : t.headingSignup}
				</h1>
				<p class="text-xs text-zinc-500 font-medium">
					{mode === 'login' ? t.subLogin : t.subSignup}
				</p>
			</div>

			<!-- Form Tabs -->
			<div class="flex items-center p-1 bg-zinc-100 rounded-xl">
				<button
					type="button"
					onclick={() => { mode = 'login'; errorMessage = null; showPassword = false; }}
					class="flex-1 py-2 rounded-lg text-xs font-extrabold transition-all text-center {mode === 'login' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}"
				>
					{t.tabLogin}
				</button>
				<button
					type="button"
					onclick={() => { mode = 'signup'; errorMessage = null; showPassword = false; }}
					class="flex-1 py-2 rounded-lg text-xs font-extrabold transition-all text-center {mode === 'signup' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}"
				>
					{t.tabSignup}
				</button>
			</div>

			{#if errorMessage}
				<div class="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
					<AlertCircle size={16} class="shrink-0 text-red-500" />
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if mode === 'signup'}
					<div>
						<label for="name" class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">{t.fullNameLabel}</label>
						<div class="relative">
							<input
								id="name"
								type="text"
								bind:value={name}
								required
								placeholder={t.fullNamePlaceholder}
								class="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 text-sm font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
							/>
							<UserIcon size={16} class="absolute left-3.5 top-3 text-zinc-400" />
						</div>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">{t.emailLabel}</label>
					<div class="relative">
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder={t.emailPlaceholder}
							class="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 text-sm font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
						/>
						<Mail size={16} class="absolute left-3.5 top-3 text-zinc-400" />
					</div>
				</div>

				<div>
					<label for="password" class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">{t.passwordLabel}</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							minlength={8}
							placeholder={t.passwordPlaceholder}
							class="w-full h-11 pl-10 pr-11 rounded-xl border border-zinc-200 text-sm font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
						/>
						<Lock size={16} class="absolute left-3.5 top-3 text-zinc-400" />
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

				<button
					type="submit"
					disabled={loading}
					class="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
				>
					{#if loading}
						<Loader2 size={16} class="animate-spin" />
						{t.loadingText}
					{:else}
						{mode === 'login' ? t.submitLogin : t.submitSignup}
						<ArrowRight size={15} />
					{/if}
				</button>
			</form>

		</div>
	</main>

	<PublicFooter />
</div>
