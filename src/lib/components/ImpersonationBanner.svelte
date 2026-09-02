<script lang="ts">
	import { onMount } from 'svelte';
	import { LogOut, Loader2, ShieldCheck } from 'lucide-svelte';
	import { getImpersonationMarker, returnToAdminSession, type ImpersonationMarker } from '$lib/admin/admin-client';
	import { toast } from '$lib/toast.svelte';

	let marker = $state<ImpersonationMarker | null>(null);
	let returning = $state(false);

	onMount(() => {
		marker = getImpersonationMarker();
		if (marker) document.documentElement.classList.add('is-impersonating');
		return () => document.documentElement.classList.remove('is-impersonating');
	});

	async function returnToAdmin() {
		if (returning) return;
		returning = true;
		try { await returnToAdminSession(); }
		catch (error) {
			toast.error(error instanceof Error ? error.message : 'Impossible de restaurer la session administrateur.');
			returning = false;
		}
	}
</script>

{#if marker}
	<div class="fixed inset-x-0 top-0 z-[100] flex h-11 items-center justify-center gap-3 bg-amber-400 px-3 text-center text-xs font-bold text-zinc-950 shadow-md">
		<ShieldCheck size={17} class="shrink-0" />
		<span class="truncate">Mode utilisateur : {marker.targetName}</span>
		<button type="button" class="btn btn-xs border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800" onclick={returnToAdmin} disabled={returning}>
			{#if returning}<Loader2 size={13} class="animate-spin" />{:else}<LogOut size={13} />{/if}
			Retour à l’administration
		</button>
	</div>
{/if}
