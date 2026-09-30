<script lang="ts">
	import InternationalPhoneInput from '$lib/components/InternationalPhoneInput.svelte';

	let {
		value = $bindable(''),
		id = 'whatsapp',
		required = false,
		disabled = false,
		label = 'Numéro WhatsApp',
		showLabel = true,
		placeholder = '37 00 1234',
		lang = 'fr'
	}: {
		value?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		label?: string;
		showLabel?: boolean;
		placeholder?: string;
		lang?: 'fr' | 'ht';
	} = $props();
</script>

<InternationalPhoneInput
	{id}
	bind:value
	{required}
	{disabled}
	{label}
	{showLabel}
	{placeholder}
	{lang}
/>
