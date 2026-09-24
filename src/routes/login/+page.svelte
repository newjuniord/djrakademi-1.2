<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authState, translateAuthError } from '$lib/auth.svelte';
	import { account, ID } from '$lib/appwrite';
	import { getOrCreateProfile, updateProfile } from '$lib/services/profiles';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import {
		ArrowRight,
		AlertCircle,
		BookOpen,
		Check,
		Eye,
		EyeOff,
		Loader2,
		Lock,
		Mail,
		Phone,
		ShieldCheck,
		Sparkles,
		User as UserIcon
	} from 'lucide-svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			pageTitleLogin: 'Connexion · DJR Akademi',
			pageTitleSignup: 'Créer un compte · DJR Akademi',
			metaDesc: 'Connectez-vous à DJR Akademi et poursuivez votre apprentissage.',
			eyebrow: 'Espace membre',
			headingLogin: 'Heureux de vous revoir.',
			headingSignup: 'Commencez votre parcours.',
			subLogin: 'Retrouvez vos cours, vos ressources et votre progression.',
			subSignup: 'Créez votre espace personnel en quelques secondes.',
			tabLogin: 'Connexion',
			tabSignup: 'Inscription',
			fullNameLabel: 'Nom complet',
			fullNamePlaceholder: 'Jean Pierre',
			phoneLabel: 'Numéro de téléphone',
			phonePlaceholder: '+509 37 00 1234',
			phoneHint: 'Format international, par exemple +50937001234',
			phoneInvalid: 'Entrez un numéro valide au format international, par exemple +50937001234.',
			emailLabel: 'Adresse email',
			emailPlaceholder: 'vous@exemple.com',
			passwordLabel: 'Mot de passe',
			passwordPlaceholder: '8 caractères minimum',
			hidePassword: 'Masquer le mot de passe',
			showPassword: 'Afficher le mot de passe',
			loadingText: 'Veuillez patienter…',
			submitLogin: 'Accéder à mon espace',
			submitSignup: 'Créer mon compte',
			secureNote: 'Connexion sécurisée et données protégées',
			imageAlt: 'Étudiant de DJR Akademi travaillant dans un studio créatif',
			visualKicker: 'Apprendre. Créer. Progresser.',
			visualTitle: 'Votre prochaine compétence commence ici.',
			visualSub: 'Des formations pratiques, pensées pour transformer vos idées en résultats.',
			benefitOne: 'Apprenez à votre rythme',
			benefitTwo: 'Accédez à vos contenus partout',
			benefitThree: 'Progressez avec des outils concrets'
		},
		ht: {
			pageTitleLogin: 'Konekte · DJR Akademi',
			pageTitleSignup: 'Kreye yon kont · DJR Akademi',
			metaDesc: 'Konekte sou DJR Akademi epi kontinye aprantisaj ou.',
			eyebrow: 'Espas manm',
			headingLogin: 'Nou kontan wè w ankò.',
			headingSignup: 'Kòmanse chemen pa w la.',
			subLogin: 'Jwenn kou, resous ak pwogrè ou yo.',
			subSignup: 'Kreye espas pèsonèl ou nan kèk segonn.',
			tabLogin: 'Koneksyon',
			tabSignup: 'Enskripsyon',
			fullNameLabel: 'Non konplè',
			fullNamePlaceholder: 'Jan Batis',
			phoneLabel: 'Nimewo telefòn',
			phonePlaceholder: '+509 37 00 1234',
			phoneHint: 'Fòma entènasyonal, pa egzanp +50937001234',
			phoneInvalid: 'Antre yon nimewo ki valab nan fòma entènasyonal, pa egzanp +50937001234.',
			emailLabel: 'Adrès imèl',
			emailPlaceholder: 'ou@egzanp.com',
			passwordLabel: 'Modpas',
			passwordPlaceholder: 'Omwen 8 karaktè',
			hidePassword: 'Kache modpas la',
			showPassword: 'Montre modpas la',
			loadingText: 'Tanpri tann…',
			submitLogin: 'Antre nan espas mwen',
			submitSignup: 'Kreye kont mwen',
			secureNote: 'Koneksyon an sekirize epi done ou yo pwoteje',
			imageAlt: 'Etidyan DJR Akademi k ap travay nan yon estidyo kreyatif',
			visualKicker: 'Aprann. Kreye. Avanse.',
			visualTitle: 'Pwochen konpetans ou kòmanse isit la.',
			visualSub: 'Fòmasyon pratik ki fèt pou transfòme lide ou yo an rezilta.',
			benefitOne: 'Aprann nan rit pa w',
			benefitTwo: 'Jwenn kontni ou nenpòt kote',
			benefitThree: 'Avanse ak zouti ki pratik'
		}
	};
	let t = $derived(i18n[currentLang]);

	let redirectTarget = $derived(
		page.url.searchParams.get('redirect') || (currentLang === 'ht' ? '/dashboard?lang=ht' : '/dashboard')
	);

	let mode = $state<'login' | 'signup'>('login');
	let name = $state('');
	let phone = $state('');
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

	function switchMode(nextMode: 'login' | 'signup') {
		mode = nextMode;
		errorMessage = null;
		showPassword = false;
	}

	function normalizePhone(value: string) {
		return value.replace(/[\s().-]/g, '');
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = null;

		const normalizedPhone = normalizePhone(phone);
		if (mode === 'signup' && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
			errorMessage = t.phoneInvalid;
			return;
		}

		loading = true;

		try {
			if (mode === 'login') {
				await account.createEmailPasswordSession(email, password);
				const user = await account.get();
				authState.user = user;
				try {
					authState.profile = await getOrCreateProfile(user.$id, user.name, user.email);
				} catch (profileError) {
					console.warn('[LoginPage] Profile error:', profileError);
				}
			} else {
				await account.create(ID.unique(), email, password, name.trim());
				await account.createEmailPasswordSession(email, password);
				const user = await account.get();
				authState.user = user;
				try {
					await getOrCreateProfile(user.$id, name.trim(), email);
					authState.profile = await updateProfile(user.$id, { whatsapp: normalizedPhone });
				} catch (profileError) {
					console.warn('[LoginPage] Profile creation error:', profileError);
				}
			}

			await goto(redirectTarget);
		} catch (error: any) {
			console.error('[LoginPage] Auth error:', error);
			errorMessage = translateAuthError(error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? t.pageTitleLogin : t.pageTitleSignup}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#f5f3ee] font-sans text-zinc-900">
	<PublicHeader />

	<main class="relative flex flex-1 items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
		<div class="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-amber-300/20 blur-3xl"></div>
		<div class="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-orange-200/30 blur-3xl"></div>

		<section class="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_90px_-45px_rgba(24,24,27,0.45)] lg:grid-cols-[0.95fr_1.05fr]">
			<div class="relative min-h-64 overflow-hidden bg-zinc-950 sm:min-h-80 lg:min-h-[690px]">
				<img
					src="/login-studio.png"
					alt={t.imageAlt}
					class="absolute inset-0 size-full object-cover object-[center_42%] lg:object-center"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/5 lg:bg-gradient-to-tr lg:from-black lg:via-black/35 lg:to-transparent"></div>

				<div class="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-10">
					<h2 class="max-w-lg text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
						{t.visualTitle}
					</h2>
					<p class="mt-3 max-w-md text-sm font-medium leading-relaxed text-white/75 sm:text-base">
						{t.visualSub}
					</p>
				</div>
			</div>

			<div class="flex items-center p-6 sm:p-10 lg:p-12 xl:p-16">
				<div class="mx-auto w-full max-w-md">
					<div class="mb-7">
						<p class="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">{t.eyebrow}</p>
						<h1 class="text-3xl font-black tracking-[-0.035em] text-zinc-950 sm:text-4xl">
							{mode === 'login' ? t.headingLogin : t.headingSignup}
						</h1>
						<p class="mt-3 text-sm font-medium leading-relaxed text-zinc-500">
							{mode === 'login' ? t.subLogin : t.subSignup}
						</p>
					</div>

					<div class="mb-6 grid grid-cols-2 rounded-2xl bg-zinc-100 p-1.5" role="tablist" aria-label={t.eyebrow}>
						<button
							type="button"
							role="tab"
							aria-selected={mode === 'login'}
							onclick={() => switchMode('login')}
							class="rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all {mode === 'login' ? 'bg-white text-zinc-950 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-900'}"
						>
							{t.tabLogin}
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={mode === 'signup'}
							onclick={() => switchMode('signup')}
							class="rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all {mode === 'signup' ? 'bg-white text-zinc-950 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-900'}"
						>
							{t.tabSignup}
						</button>
					</div>

					{#if errorMessage}
						<div role="alert" aria-live="polite" class="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold leading-relaxed text-red-700">
							<AlertCircle size={17} class="mt-0.5 shrink-0 text-red-500" />
							<span>{errorMessage}</span>
						</div>
					{/if}

					<form onsubmit={handleSubmit} class="space-y-4">
						{#if mode === 'signup'}
							<div class="space-y-1.5">
								<label for="name" class="ml-1 block text-xs font-bold text-zinc-700">{t.fullNameLabel}</label>
								<div class="relative">
									<UserIcon size={17} class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
									<input
										id="name"
										type="text"
										bind:value={name}
										required
										maxlength="255"
										autocomplete="name"
										disabled={loading}
										placeholder={t.fullNamePlaceholder}
										class="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm font-medium text-zinc-950 outline-none transition hover:border-zinc-300 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
									/>
								</div>
							</div>

							<div class="space-y-1.5">
								<label for="phone" class="ml-1 block text-xs font-bold text-zinc-700">{t.phoneLabel}</label>
								<div class="relative">
									<Phone size={17} class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
									<input
										id="phone"
										type="tel"
										bind:value={phone}
										required
										maxlength="20"
										autocomplete="tel"
										inputmode="tel"
										disabled={loading}
										placeholder={t.phonePlaceholder}
										aria-describedby="phone-hint"
										class="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm font-medium text-zinc-950 outline-none transition hover:border-zinc-300 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
									/>
								</div>
								<p id="phone-hint" class="ml-1 text-[11px] font-medium text-zinc-400">{t.phoneHint}</p>
							</div>
						{/if}

						<div class="space-y-1.5">
							<label for="email" class="ml-1 block text-xs font-bold text-zinc-700">{t.emailLabel}</label>
							<div class="relative">
								<Mail size={17} class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
								<input
									id="email"
									type="email"
									bind:value={email}
									required
									autocomplete="email"
									disabled={loading}
									placeholder={t.emailPlaceholder}
									class="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm font-medium text-zinc-950 outline-none transition hover:border-zinc-300 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="password" class="ml-1 block text-xs font-bold text-zinc-700">{t.passwordLabel}</label>
							<div class="relative">
								<Lock size={17} class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									bind:value={password}
									required
									minlength={8}
									maxlength={256}
									autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
									disabled={loading}
									placeholder={t.passwordPlaceholder}
									class="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-12 text-sm font-medium text-zinc-950 outline-none transition hover:border-zinc-300 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									disabled={loading}
									class="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-50"
									aria-label={showPassword ? t.hidePassword : t.showPassword}
									aria-pressed={showPassword}
								>
									{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="group mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-xs font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-zinc-950/15 transition hover:-translate-y-0.5 hover:bg-amber-400 hover:text-zinc-950 hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
						>
							{#if loading}
								<Loader2 size={17} class="animate-spin" />
								{t.loadingText}
							{:else}
								{mode === 'login' ? t.submitLogin : t.submitSignup}
								<ArrowRight size={16} class="transition-transform group-hover:translate-x-1" />
							{/if}
						</button>
					</form>

					<div class="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-zinc-400">
						<ShieldCheck size={15} class="text-emerald-600" />
						<span>{t.secureNote}</span>
					</div>
				</div>
			</div>
		</section>
	</main>
</div>
