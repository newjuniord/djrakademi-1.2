<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { authState } from '$lib/auth.svelte';
	import AdminToast from '$lib/components/admin/AdminToast.svelte';
	import ImpersonationBanner from '$lib/components/ImpersonationBanner.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import FloatingWhatsApp from '$lib/components/FloatingWhatsApp.svelte';
	import { client } from '$lib/appwrite';

	let { children } = $props();
	let showFloatingWidgets = $derived(
		!['/admin', '/learn', '/cours', '/dashboard'].some((prefix) => page.url.pathname === prefix || page.url.pathname.startsWith(`${prefix}/`))
	);
	$effect(() => {
		document.documentElement.lang = page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr';
	});

	onMount(() => {
		authState.check();
		try {
			(client as any).ping?.();
		} catch {
			/* Ping verification. */
		}
	});

	function handleLoginSuccess() {
		authState.triggerLoginSuccess();
	}
</script>

<ImpersonationBanner />
{@render children()}
<AuthModal bind:isOpen={authState.showAuthModal} onLogin={handleLoginSuccess} />
{#if showFloatingWidgets}
	<FloatingWhatsApp />
{/if}
<AdminToast />
