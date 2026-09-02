<script lang="ts">
	import { normalizeE164 } from '$lib/coaching/validation';
	import { MessageSquare } from 'lucide-svelte';

	let {
		value = $bindable(''),
		id = 'whatsapp',
		required = false,
		label = 'Numéro WhatsApp',
		showLabel = true,
		placeholder = '+509 3700 1234'
	}: {
		value?: string;
		id?: string;
		required?: boolean;
		label?: string;
		showLabel?: boolean;
		placeholder?: string;
	} = $props();
</script>

<div class="form-control w-full space-y-1.5">
	{#if showLabel}
		<label class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70 flex items-center justify-between" for={id}>
			<span>{label}</span>
			<span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
				Format International
			</span>
		</label>
	{/if}

	<div class="relative flex items-center w-full group">
		<!-- Left WhatsApp Icon Accent -->
		<div class="absolute left-3.5 flex items-center pointer-events-none text-emerald-500 transition-transform group-focus-within:scale-110">
			<MessageSquare size={15} class="fill-emerald-500/10" />
		</div>

		<!-- Input Field -->
		<input
			{id}
			class="input input-sm w-full pl-10 pr-4 h-10 rounded-xl text-xs font-mono font-bold text-base-content bg-base-100 border border-base-300 shadow-2xs hover:border-base-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:font-sans placeholder:font-normal placeholder:text-base-content/35"
			type="tel"
			{placeholder}
			bind:value
			{required}
			onblur={() => (value = normalizeE164(value))}
			autocomplete="tel"
		/>
	</div>
</div>
