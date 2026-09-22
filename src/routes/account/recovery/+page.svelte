<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowLeft, CheckCircle2, Eye, EyeOff, Home, KeyRound, Loader2, ShieldCheck } from 'lucide-svelte';

	import { translateAuthError } from '$lib/auth.svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			title: 'Nouveau mot de passe · DJR Akademi',
			backHome: 'Retour à l\'accueil',
			changedTitle: 'Mot de passe modifié',
			changedSubtitle: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
			createTitle: 'Créer un nouveau mot de passe',
			createSubtitle: 'Choisissez un mot de passe d\'au moins 8 caractères.',
			newPasswordLabel: 'Nouveau mot de passe',
			confirmPasswordLabel: 'Confirmer le mot de passe',
			minCharPlaceholder: '8 caractères minimum',
			confirmPlaceholder: 'Saisissez-le une seconde fois',
			submiting: 'Modification en cours…',
			submitBtn: 'Enregistrer le nouveau mot de passe',
			hidePassword: 'Masquer le mot de passe',
			showPassword: 'Afficher le mot de passe',
			hideConfirmation: 'Masquer la confirmation',
			showConfirmation: 'Afficher la confirmation',
			errMinLength: 'Le mot de passe doit comporter au moins 8 caractères.',
			errMismatch: 'Les mots de passe ne correspondent pas.',
			errIncompleteLink: 'Le lien de récupération est invalide ou incomplet.',
			errGeneric: 'Impossible de modifier le mot de passe.'
		},
		ht: {
			title: 'Nouvèl Mopas · DJR Akademi',
			backHome: 'Tounen nan akèy',
			changedTitle: 'Mopas la chanje',
			changedSubtitle: 'Ou ka konekte kounye a ak nouvèl mopas ou an.',
			createTitle: 'Kreye yon nouvèl mopas',
			createSubtitle: 'Chwazi yon mopas ki gen omwens 8 karaktè.',
			newPasswordLabel: 'Nouvèl mopas',
			confirmPasswordLabel: 'Konfime mopas la',
			minCharPlaceholder: '8 karaktè minimum',
			confirmPlaceholder: 'Mete l yon dezyèm fwa',
			submiting: 'Modifikasyon an ap fèt…',
			submitBtn: 'Anregistre nouvèl mopas la',
			hidePassword: 'Masquer le mot de passe',
			showPassword: 'Afficher le mot de passe',
			hideConfirmation: 'Masquer la confirmation',
			showConfirmation: 'Afficher la confirmation',
			errMinLength: 'Modpas la dwe gen omwens 8 karaktè.',
			errMismatch: 'Modpas yo pa menm.',
			errIncompleteLink: 'Lyen rekiperasyon an pa bon oswa li pa konplè.',
			errGeneric: 'Nou pa ka chanje modpas la.'
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
			if (!response.ok) throw new Error(result.message || t.errGeneric);
			completed = true;
		} catch (error) {
			errorMessage = translateAuthError(error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{t.title}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="grid min-h-dvh place-items-center bg-zinc-950 p-4 text-zinc-950">
	<section class="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
		<a href={getHref('/')} class="mb-7 inline-flex items-center gap-2 text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-950">
			<ArrowLeft size={15} /> {t.backHome}
		</a>
		<div class="mb-6 grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-600">
			{#if completed}<CheckCircle2 size={24} />{:else}<KeyRound size={22} />{/if}
		</div>
		{#if completed}
			<h1 class="text-2xl font-black">{t.changedTitle}</h1>
			<p class="mt-2 text-sm text-zinc-500">{t.changedSubtitle}</p>
			<button class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-3.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800" onclick={() => goto(getHref('/'))}>
				<Home size={17} /> {t.backHome}
			</button>
		{:else}
			<h1 class="text-2xl font-black">{t.createTitle}</h1>
			<p class="mt-2 text-sm text-zinc-500">{t.createSubtitle}</p>
			<form class="mt-7 space-y-5" onsubmit={updatePassword}>
				<div class="space-y-2">
					<label for="new-password" class="ml-1 text-xs font-bold text-zinc-700">{t.newPasswordLabel}</label>
					<div class="relative">
						<input id="new-password" class="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-12 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100" type={showPassword ? 'text' : 'password'} bind:value={password} required minlength="8" maxlength="256" autocomplete="new-password" placeholder={t.minCharPlaceholder} />
						<button type="button" class="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-400 transition hover:text-zinc-700" onclick={() => (showPassword = !showPassword)} aria-label={showPassword ? t.hidePassword : t.showPassword} aria-pressed={showPassword}>
							{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
						</button>
					</div>
				</div>
				<div class="space-y-2">
					<label for="confirm-password" class="ml-1 text-xs font-bold text-zinc-700">{t.confirmPasswordLabel}</label>
					<div class="relative">
						<input id="confirm-password" class="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-12 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100" type={showConfirmation ? 'text' : 'password'} bind:value={confirmation} required minlength="8" maxlength="256" autocomplete="new-password" placeholder={t.confirmPlaceholder} />
						<button type="button" class="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-400 transition hover:text-zinc-700" onclick={() => (showConfirmation = !showConfirmation)} aria-label={showConfirmation ? t.hideConfirmation : t.showConfirmation} aria-pressed={showConfirmation}>
							{#if showConfirmation}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
						</button>
					</div>
				</div>
				{#if errorMessage}<div role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{errorMessage}</div>{/if}
				<button class="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-3.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
					{#if loading}<Loader2 class="animate-spin" size={16} />{:else}<ShieldCheck size={17} />{/if}
					{loading ? t.submiting : t.submitBtn}
				</button>
			</form>
		{/if}
	</section>
</main>
