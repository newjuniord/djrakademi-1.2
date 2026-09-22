<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { account } from '$lib/appwrite';
	import { authState } from '$lib/auth.svelte';
	import { downloadOwnedEbook } from '$lib/services/ebook-access';
	import { CheckCircle2, Loader2, AlertCircle } from 'lucide-svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			title: 'Accès sécurisé · DJR Akademi',
			heading: 'Accès à votre achat',
			connecting: 'Connexion sécurisée à votre compte…',
			incompleteLink: 'Ce lien de connexion est incomplet.',
			preparingEbook: 'Préparation de votre e-book…',
			accessConfirmed: 'Accès confirmé. Redirection…',
			loginSuccessEbook: 'Connexion réussie. Préparation de votre e-book…',
			loginSuccessRedirect: 'Connexion réussie. Redirection…',
			accessError: 'Une erreur est survenue lors de la connexion. Connectez-vous à votre compte pour accéder à votre achat.',
			unlockError: 'Impossible de débloquer cet accès.',
			invalidSecret: 'Secret de connexion invalide.',
			loginBtn: 'Se connecter',
			contactSupport: 'Contacter le support'
		},
		ht: {
			title: 'Aksè ansekirite · DJR Akademi',
			heading: 'Aksè nan achte w la',
			connecting: 'N ap konekte w nan kont ou ansekirite…',
			incompleteLink: 'Lyen koneksyon sa a pa konplè.',
			preparingEbook: 'N ap prepare ebook ou an…',
			accessConfirmed: 'Aksè konfime. Redirection…',
			loginSuccessEbook: 'Koneksyon an reyisi. N ap prepare ebook ou an…',
			loginSuccessRedirect: 'Koneksyon an reyisi. Redireksyon…',
			accessError: 'Yon erè rive pandan koneksyon an. Konekte w sou kont ou pou w jwenn achte w la.',
			unlockError: 'Nou pa ka debloke aksè sa a.',
			invalidSecret: 'Mopas koneksyon an pa bon.',
			loginBtn: 'Konekte',
			contactSupport: 'Kontakte sipò a'
		}
	};

	let t = $derived(i18n[currentLang]);

	let status = $state<'loading' | 'success' | 'error'>('loading');
	let message = $state('');

	function safeDestination(value: string | null): string {
		if (!value || !value.startsWith('/') || value.startsWith('//')) return getHref('/dashboard');
		return currentLang === 'ht' && !value.includes('lang=ht') ? (value.includes('?') ? `${value}&lang=ht` : `${value}?lang=ht`) : value;
	}

	onMount(async () => {
		message = i18n[currentLang].connecting;
		const orderId = page.url.searchParams.get('orderId') || '';
		const userId = page.url.searchParams.get('userId') || '';
		const token = page.url.searchParams.get('token') || '';
		const legacySecret = page.url.searchParams.get('secret') || '';
		const destination = safeDestination(page.url.searchParams.get('next'));
		const downloadEbook = page.url.searchParams.get('downloadEbook');

		if (!userId || (!token && !legacySecret)) {
			status = 'error';
			message = i18n[currentLang].incompleteLink;
			return;
		}

		try {
			let currentUser = await account.get().catch(() => null);

			// If current user is already logged in as the buyer, proceed directly
			if (currentUser?.$id === userId) {
				await authState.check();
				status = 'success';
				message = downloadEbook ? i18n[currentLang].preparingEbook : i18n[currentLang].accessConfirmed;
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
					throw new Error(data.message || i18n[currentLang].unlockError);
				}
				activeSecret = data.secret;
			}

			if (!activeSecret) throw new Error(i18n[currentLang].invalidSecret);

			await account.createSession({ userId, secret: activeSecret });
			await authState.check();
			status = 'success';
			message = downloadEbook ? i18n[currentLang].loginSuccessEbook : i18n[currentLang].loginSuccessRedirect;
			if (downloadEbook) await downloadOwnedEbook(downloadEbook).catch(() => undefined);
			await goto(destination, { replaceState: true });
		} catch (error: any) {
			console.error('[Purchase access]:', error);
			status = 'error';
			message = error?.message || i18n[currentLang].accessError;
		}
	});
</script>

<svelte:head><title>{t.title}</title><meta name="robots" content="noindex,nofollow" /></svelte:head>

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
			<h1 class="mt-3 text-2xl font-bold">{t.heading}</h1>
			<p class="text-sm text-base-content/65">{message}</p>
			{#if status === 'error'}
				<div class="mt-4 flex w-full flex-col gap-2">
					<a class="btn btn-primary" href={getHref('/')}>{t.loginBtn}</a>
					<a class="btn btn-ghost" href={getHref('/contact')}>{t.contactSupport}</a>
				</div>
			{/if}
		</div>
	</section>
</main>
