<script lang="ts">
	import { onMount } from 'svelte';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import AdminToast from '$lib/components/admin/AdminToast.svelte';
	import { getAdminSession } from '$lib/admin/admin-client';
	import { Loader2, ShieldAlert } from 'lucide-svelte';

	let { children } = $props();
	let drawerOpen = $state(false);
	let checkingAccess = $state(true);
	let accessError = $state<string | null>(null);

	async function checkAccess() {
		checkingAccess = true;
		accessError = null;
		try { await getAdminSession(); }
		catch (error) { accessError = error instanceof Error ? error.message : 'Accès administrateur refusé.'; }
		finally { checkingAccess = false; }
	}

	onMount(checkAccess);
</script>

{#if checkingAccess}
	<div class="grid min-h-dvh place-items-center bg-base-200"><div class="space-y-3 text-center text-base-content/60"><Loader2 size={32} class="mx-auto animate-spin text-primary" /><p class="text-sm font-semibold">Vérification de l’accès administrateur…</p></div></div>
{:else if accessError}
	<div class="grid min-h-dvh place-items-center bg-base-200 p-6"><div class="card max-w-md items-center gap-4 bg-base-100 p-8 text-center shadow-sm"><ShieldAlert size={36} class="text-error" /><h1 class="text-xl font-bold">Accès administrateur impossible</h1><p class="text-sm text-base-content/60">{accessError}</p><div class="flex gap-2"><a href="/" class="btn btn-ghost">Retour au site</a><button type="button" class="btn btn-primary" onclick={checkAccess}>Réessayer</button></div></div></div>
{:else}
<div class="drawer lg:drawer-open">
	<input id="admin-drawer" class="drawer-toggle" type="checkbox" bind:checked={drawerOpen} />

	<div class="drawer-content flex min-h-dvh min-w-0 flex-col bg-base-200">
		<AdminHeader onMenuClick={() => (drawerOpen = true)} />
		<main class="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>

	<div class="drawer-side z-40">
		<label for="admin-drawer" class="drawer-overlay" aria-label="Fermer le menu"></label>
		<AdminSidebar onNavigate={() => (drawerOpen = false)} />
	</div>

	<AdminToast />
</div>
{/if}
