<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-svelte';

	import { translateAuthError } from '$lib/auth.svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		if (currentLang !== 'ht') return path;
		const url = new URL(path, page.url);
		url.searchParams.set('lang', 'ht');
		return `${url.pathname}${url.search}${url.hash}`;
	}

	const i18n = {
		fr: {
			title: 'Mot de passe · DJR Akademi',
			backHome: 'Accueil',
			imageAlt: 'Studio DJR Akademi',
			changedTitle: 'Mot de passe mis à jour',
			changedSubtitle: 'Vous pouvez maintenant vous connecter.',
			createTitle: 'Nouveau mot de passe',
			createSubtitle: '8 caractères minimum.',
			newPasswordLabel: 'Mot de passe',
			confirmPasswordLabel: 'Confirmation',
			minCharPlaceholder: '8+ caractères',
			confirmPlaceholder: 'Répéter',
			submitting: 'Enregistrement…',
			submitBtn: 'Enregistrer',
			hidePassword: 'Masquer le mot de passe',
			showPassword: 'Afficher le mot de passe',
			hideConfirmation: 'Masquer la confirmation',
			showConfirmation: 'Afficher la confirmation',
			errMinLength: '8 caractères minimum.',
			errMismatch: 'Mots de passe différents.',
			errIncompleteLink: 'Lien invalide.',
			errGeneric: 'Échec de la modification.'
		},
		ht: {
			title: 'Modpas · DJR Akademi',
			backHome: 'Akèy',
			imageAlt: 'Estidyo DJR Akademi',
			changedTitle: 'Modpas chanje',
			changedSubtitle: 'Ou ka konekte kounye a.',
			createTitle: 'Nouvo modpas',
			createSubtitle: 'Omwen 8 karaktè.',
			newPasswordLabel: 'Modpas',
			confirmPasswordLabel: 'Konfimasyon',
			minCharPlaceholder: '8+ karaktè',
			confirmPlaceholder: 'Repete',
			submitting: 'Ap anrejistre…',
			submitBtn: 'Anrejistre',
			hidePassword: 'Kache modpas la',
			showPassword: 'Montre modpas la',
			hideConfirmation: 'Kache konfimasyon an',
			showConfirmation: 'Montre konfimasyon an',
			errMinLength: 'Omwen 8 karaktè.',
			errMismatch: 'Modpas yo pa menm.',
			errIncompleteLink: 'Lyen an pa bon.',
			errGeneric: 'Chanjman an echwe.'
		}
	};

	let t = $derived(i18n[currentLang]);

	let password = $state('');
	let confirmation = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let completed = $state(false);
	let showPassword = $state(false);
	let showConfirmation = $state(false);

	async function updatePassword(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		if (password.length < 8) {
			errorMessage = t.errMinLength;
			return;
		}
		if (password !== confirmation) {
			errorMessage = t.errMismatch;
			return;
		}
		const userId = page.url.searchParams.get('userId') || '';
		const secret = page.url.searchParams.get('secret') || '';
		if (!userId || !secret) {
			errorMessage = t.errIncompleteLink;
			return;
		}
		try {
			loading = true;
			const response = await fetch('/api/account/recovery/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, secret, password })
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(t.errGeneric);
			completed = true;
		} catch (error) {
			errorMessage = translateAuthError(error, currentLang);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{t.title}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="grid min-h-dvh place-items-center bg-white p-4 sm:p-8 text-zinc-950">
	<section class="grid w-full max-w-[946px] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:min-h-[530px] lg:grid-cols-2">
		<div class="relative hidden min-h-[530px] bg-zinc-100 lg:block">
			<img
				src="/login-studio.png"
				alt={t.imageAlt}
				class="absolute inset-0 block size-full object-cover"
			/>
		</div>

		<div class="flex items-center p-6 sm:p-10 lg:p-12">
			<div class="mx-auto w-full max-w-sm">
				<a href={getHref('/')} class="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950">
					<ArrowLeft size={14} /> {t.backHome}
				</a>

				{#if completed}
					<div class="space-y-2">
						<CheckCircle2 size={24} class="text-emerald-600" />
						<h1 class="text-2xl font-semibold tracking-tight">{t.changedTitle}</h1>
						<p class="text-sm text-zinc-500">{t.changedSubtitle}</p>
					</div>
					<button
						type="button"
						class="mt-6 h-11 w-full rounded-lg bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 cursor-pointer"
						onclick={() => goto(getHref('/'))}
					>
						{t.backHome}
					</button>
				{:else}
					<div class="space-y-1">
						<h1 class="text-2xl font-semibold tracking-tight">{t.createTitle}</h1>
						<p class="text-sm text-zinc-500">{t.createSubtitle}</p>
					</div>

					<form class="mt-7 space-y-5" onsubmit={updatePassword}>
						<div class="space-y-1.5">
							<label for="new-password" class="block text-xs font-medium text-zinc-700">{t.newPasswordLabel}</label>
							<div class="relative">
								<input
									id="new-password"
									name="password"
									class="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 pr-11 text-sm outline-none transition focus:border-zinc-900"
									type={showPassword ? 'text' : 'password'}
									bind:value={password}
									required
									minlength="8"
									maxlength="256"
									autocomplete="new-password"
									enterkeyhint="next"
									placeholder={t.minCharPlaceholder}
								/>
								<button
									type="button"
									class="absolute inset-y-0 right-0 grid w-11 place-items-center text-zinc-400 transition hover:text-zinc-700 cursor-pointer"
									onclick={() => (showPassword = !showPassword)}
									aria-label={showPassword ? t.hidePassword : t.showPassword}
									aria-pressed={showPassword}
								>
									{#if showPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
								</button>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="confirm-password" class="block text-xs font-medium text-zinc-700">{t.confirmPasswordLabel}</label>
							<div class="relative">
								<input
									id="confirm-password"
									name="confirm-password"
									class="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 pr-11 text-sm outline-none transition focus:border-zinc-900"
									type={showConfirmation ? 'text' : 'password'}
									bind:value={confirmation}
									required
									minlength="8"
									maxlength="256"
									autocomplete="new-password"
									enterkeyhint="done"
									placeholder={t.confirmPlaceholder}
								/>
								<button
									type="button"
									class="absolute inset-y-0 right-0 grid w-11 place-items-center text-zinc-400 transition hover:text-zinc-700 cursor-pointer"
									onclick={() => (showConfirmation = !showConfirmation)}
									aria-label={showConfirmation ? t.hideConfirmation : t.showConfirmation}
									aria-pressed={showConfirmation}
								>
									{#if showConfirmation}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
								</button>
							</div>
						</div>

						{#if errorMessage}
							<p role="alert" class="text-xs font-medium text-red-600">{errorMessage}</p>
						{/if}

						<button
							type="submit"
							class="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
							disabled={loading}
						>
							{#if loading}<Loader2 class="animate-spin" size={16} />{/if}
							{loading ? t.submitting : t.submitBtn}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</section>
</main>
