<script lang="ts">
	import { toast } from '$lib/toast.svelte';
	import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
</script>

{#if toast.items.length > 0}
	<div class="toast toast-end toast-bottom z-50 p-4 space-y-2 w-full max-w-md pointer-events-auto">
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
					<span class="break-words whitespace-pre-line leading-relaxed">{item.message}</span>
				</div>
				<button
					type="button"
					class="btn btn-ghost btn-xs btn-square text-white/80 hover:text-white rounded-lg -mr-1 shrink-0 cursor-pointer"
					onclick={() => toast.remove(item.id)}
					aria-label="Fèmen an"
				>
					<X size={16} />
				</button>
			</div>
		{/each}
	</div>
{/if}
