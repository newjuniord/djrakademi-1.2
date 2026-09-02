<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { authState } from '$lib/auth.svelte';
	import AdminToast from '$lib/components/admin/AdminToast.svelte';
	import ImpersonationBanner from '$lib/components/ImpersonationBanner.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import { client } from '$lib/appwrite';

	let { children } = $props();

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
<AdminToast />
