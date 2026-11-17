<script lang="ts">
	import { toast } from '$lib/toast.svelte';
	import { page } from '$app/state';
	import { translateAdminToastMessage } from '$lib/admin/admin-localization';
	import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');
	let closeLabel = $derived(page.url.searchParams.get('lang') === 'ht' ? 'Fèmen notifikasyon an' : 'Fermer la notification');

	function showAboveModal(node: HTMLDivElement) {
		// Native modal dialogs sit above every z-index; popovers share their top layer.
		// Keep the toast inside the active dialog so its close button remains interactive.
		document.querySelector('dialog:modal')?.appendChild(node);
		node.showPopover?.();
		return { destroy: () => node.remove() };
	}
</script>

{#if toast.items.length > 0}
	<div popover="manual" use:showAboveModal class="toast toast-end toast-bottom z-[10000] m-0 border-0 overflow-visible p-4 space-y-2 w-full max-w-md pointer-events-auto">
		{#each toast.items as item (item.id)}
			<div
				class={`alert shadow-xl font-medium text-xs sm:text-sm text-white rounded-2xl border flex items-start justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200 p-4 ${
					item.type === 'error'
						? 'bg-rose-600 border-rose-500/30'
						: item.type === 'info'
							? 'bg-sky-600 border-sky-500/30'
							: 'bg-emerald-600 border-emerald-500/30'
				}`}
			>
				<div class="flex items-start gap-3 min-w-0">
					{#if item.type === 'error'}
						<AlertCircle size={20} class="shrink-0 text-white mt-0.5" />
					{:else if item.type === 'info'}
						<Info size={20} class="shrink-0 text-white mt-0.5" />
					{:else}
						<CheckCircle2 size={20} class="shrink-0 text-white mt-0.5" />
					{/if}
					<span class="break-words whitespace-pre-line leading-relaxed">{translateAdminToastMessage(item.message, currentLang, item.type)}</span>
				</div>
				<button
					type="button"
					class="btn btn-ghost btn-xs btn-square text-white/80 hover:text-white rounded-lg -mr-1 shrink-0 cursor-pointer"
					onclick={() => toast.remove(item.id)}
					aria-label={closeLabel}
				>
					<X size={16} />
				</button>
			</div>
		{/each}
	</div>
{/if}
