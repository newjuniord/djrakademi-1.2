<script lang="ts">
	import { toast } from '$lib/toast.svelte';
	import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
</script>

{#if toast.items.length > 0}
	<div class="toast toast-end toast-bottom z-50 p-4 space-y-2 max-w-sm pointer-events-auto">
		{#each toast.items as item (item.id)}
			<div
				class={`alert shadow-xl font-bold text-xs text-white rounded-xl border flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200 ${
					item.type === 'error'
						? 'bg-rose-600 border-rose-500/30'
						: item.type === 'info'
							? 'bg-sky-600 border-sky-500/30'
							: 'bg-emerald-600 border-emerald-500/30'
				}`}
			>
				<div class="flex items-center gap-2.5 min-w-0">
					{#if item.type === 'error'}
						<AlertCircle size={18} class="shrink-0 text-white" />
					{:else if item.type === 'info'}
						<Info size={18} class="shrink-0 text-white" />
					{:else}
						<CheckCircle2 size={18} class="shrink-0 text-white" />
					{/if}
					<span class="truncate">{item.message}</span>
				</div>
				<button
					type="button"
					class="btn btn-ghost btn-xs btn-square text-white/80 hover:text-white rounded-lg -mr-1"
					onclick={() => toast.remove(item.id)}
				>
					<X size={14} />
				</button>
			</div>
		{/each}
	</div>
{/if}
