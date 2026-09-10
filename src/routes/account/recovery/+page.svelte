<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowLeft, CheckCircle2, Eye, EyeOff, Home, KeyRound, Loader2, ShieldCheck } from 'lucide-svelte';

	import { translateAuthError } from '$lib/auth.svelte';

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
			errorMessage = 'Modpas la dwe gen omwens 8 karaktè.';
			return;
		}
		if (password !== confirmation) {
			errorMessage = 'Modpas yo pa menm.';
			return;
		}
		const userId = page.url.searchParams.get('userId') || '';
		const secret = page.url.searchParams.get('secret') || '';
		if (!userId || !secret) {
			errorMessage = 'Lyen rekiperasyon an pa bon oswa li pa konplè.';
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
			if (!response.ok) throw new Error(result.message || 'Nou pa ka chanje modpas la.');
			completed = true;
		} catch (error) {
			errorMessage = translateAuthError(error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Nouvèl Mopas · DJR Akademi</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="grid min-h-dvh place-items-center bg-zinc-950 p-4 text-zinc-950">
	<section class="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
		<a href="/" class="mb-7 inline-flex items-center gap-2 text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-950">
			<ArrowLeft size={15} /> Tounen nan akèy
		</a>
		<div class="mb-6 grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-600">
			{#if completed}<CheckCircle2 size={24} />{:else}<KeyRound size={22} />{/if}
		</div>
		{#if completed}
			<h1 class="text-2xl font-black">Mopas la chanje</h1>
			<p class="mt-2 text-sm text-zinc-500">Ou ka konekte kounye a ak nouvèl mopas ou an.</p>
			<button class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-3.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800" onclick={() => goto('/')}>
				<Home size={17} /> Tounen nan akèy
			</button>
		{:else}
			<h1 class="text-2xl font-black">Kreye yon nouvèl mopas</h1>
			<p class="mt-2 text-sm text-zinc-500">Chwazi yon mopas ki gen omwens 8 karaktè.</p>
			<form class="mt-7 space-y-5" onsubmit={updatePassword}>
				<div class="space-y-2">
					<label for="new-password" class="ml-1 text-xs font-bold text-zinc-700">Nouvèl mopas</label>
					<div class="relative">
						<input id="new-password" class="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-12 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100" type={showPassword ? 'text' : 'password'} bind:value={password} required minlength="8" maxlength="256" autocomplete="new-password" placeholder="8 karaktè minimum" />
						<button type="button" class="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-400 transition hover:text-zinc-700" onclick={() => (showPassword = !showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword}>
							{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
						</button>
					</div>
				</div>
				<div class="space-y-2">
					<label for="confirm-password" class="ml-1 text-xs font-bold text-zinc-700">Konfime mopas la</label>
					<div class="relative">
						<input id="confirm-password" class="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-12 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100" type={showConfirmation ? 'text' : 'password'} bind:value={confirmation} required minlength="8" maxlength="256" autocomplete="new-password" placeholder="Mete l yon dezyèm fwa" />
						<button type="button" class="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-400 transition hover:text-zinc-700" onclick={() => (showConfirmation = !showConfirmation)} aria-label={showConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'} aria-pressed={showConfirmation}>
							{#if showConfirmation}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
						</button>
					</div>
				</div>
				{#if errorMessage}<div role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{errorMessage}</div>{/if}
				<button class="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-3.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
					{#if loading}<Loader2 class="animate-spin" size={16} />{:else}<ShieldCheck size={17} />{/if}
					{loading ? 'Modifikasyon an ap fèt…' : 'Anregistre nouvèl mopas la'}
				</button>
			</form>
		{/if}
	</section>
</main>
