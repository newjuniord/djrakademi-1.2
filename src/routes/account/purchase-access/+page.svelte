<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { account } from '$lib/appwrite';
	import { authState } from '$lib/auth.svelte';
	import { downloadOwnedEbook } from '$lib/services/ebook-access';
	import { CheckCircle2, Loader2, AlertCircle } from 'lucide-svelte';

	let status = $state<'loading' | 'success' | 'error'>('loading');
	let message = $state('N ap konekte w nan kont ou ansekirite…');

	function safeDestination(value: string | null): string {
		if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
		return value;
	}

	onMount(async () => {
		const orderId = page.url.searchParams.get('orderId') || '';
		const userId = page.url.searchParams.get('userId') || '';
		const token = page.url.searchParams.get('token') || '';
		const legacySecret = page.url.searchParams.get('secret') || '';
		const destination = safeDestination(page.url.searchParams.get('next'));
		const downloadEbook = page.url.searchParams.get('downloadEbook');

		if (!userId || (!token && !legacySecret)) {
			status = 'error';
			message = 'Lyen koneksyon sa a pa konplè.';
			return;
		}

		try {
			let currentUser = await account.get().catch(() => null);

			// If current user is already logged in as the buyer, proceed directly
			if (currentUser?.$id === userId) {
				await authState.check();
				status = 'success';
				message = downloadEbook ? 'N ap prepare ebook ou an…' : 'Aksè konfime. Redireksyon…';
				if (downloadEbook) await downloadOwnedEbook(downloadEbook).catch(() => undefined);
				await goto(destination, { replaceState: true });
				return;
			}

			// Logout current user if logged in as someone else
			if (currentUser) {
				await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
			}

			let activeSecret = legacySecret;

			// If using permanent HMAC token, authenticate via /api/account/purchase-login
			if (orderId && token) {
				const res = await fetch('/api/account/purchase-login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ orderId, userId, token })
				});
				const data = await res.json().catch(() => ({}));
				if (!res.ok || !data.secret) {
					throw new Error(data.message || 'Nou pa ka debloke aksè sa a.');
				}
				activeSecret = data.secret;
			}

			if (!activeSecret) throw new Error('Secret de connexion invalide.');

			await account.createSession({ userId, secret: activeSecret });
			await authState.check();
			status = 'success';
			message = downloadEbook ? 'Koneksyon an reyisi. N ap prepare ebook ou an…' : 'Koneksyon an reyisi. Redireksyon…';
			if (downloadEbook) await downloadOwnedEbook(downloadEbook).catch(() => undefined);
			await goto(destination, { replaceState: true });
		} catch (error: any) {
			console.error('[Purchase access]:', error);
			status = 'error';
			message = error?.message || 'Yon erè rive pandan koneksyon an. Konekte w sou kont ou pou w jwenn achte w la.';
		}
	});
</script>

<svelte:head><title>Aksè ansekirite · DJR Akademi</title><meta name="robots" content="noindex,nofollow" /></svelte:head>

<main class="grid min-h-dvh place-items-center bg-base-200 p-4">
	<section class="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl">
		<div class="card-body items-center p-8 text-center">
			{#if status === 'loading'}
				<Loader2 size={42} class="animate-spin text-primary" />
			{:else if status === 'success'}
				<CheckCircle2 size={42} class="text-success" />
			{:else}
				<AlertCircle size={42} class="text-error" />
			{/if}
			<h1 class="mt-3 text-2xl font-bold">Aksè nan achte w la</h1>
			<p class="text-sm text-base-content/65">{message}</p>
			{#if status === 'error'}
				<div class="mt-4 flex w-full flex-col gap-2">
					<a class="btn btn-primary" href="/">Konekte</a>
					<a class="btn btn-ghost" href="/contact">Kontakte sipò a</a>
				</div>
			{/if}
		</div>
	</section>
</main>
