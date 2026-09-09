<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import AdminToast from '$lib/components/admin/AdminToast.svelte';
	import { getAdminSession } from '$lib/admin/admin-client';
	import { authState } from '$lib/auth.svelte';
	import { Loader2 } from 'lucide-svelte';

	let { children } = $props();
	let drawerOpen = $state(false);
	let checkingAccess = $state(true);

	async function checkAccess() {
		checkingAccess = true;
		try {
			await getAdminSession();
		} catch {
			await goto('/', { replaceState: true });
			return;
		} finally {
			checkingAccess = false;
		}
	}

	$effect(() => {
		if (!authState.loading && !authState.isAdmin && !checkingAccess) {
			goto('/', { replaceState: true });
		}
	});

	onMount(() => {
		checkAccess();
		document.documentElement.lang = 'fr';
		return () => {
			document.documentElement.lang = 'ht';
		};
	});
</script>

{#if checkingAccess}
	<div class="grid min-h-dvh place-items-center bg-base-200">
		<div class="space-y-3 text-center text-base-content/60">
			<Loader2 size={32} class="mx-auto animate-spin text-primary" />
			<p class="text-sm font-semibold">Vérification de l’accès administrateur…</p>
		</div>
	</div>
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
