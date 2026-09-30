<script lang="ts">
	import { COUNTRIES, DEFAULT_COUNTRY, parsePhoneNumber, type Country } from '$lib/utils/countries';
	import { ChevronDown, Search, MessageSquare, Check, Phone } from 'lucide-svelte';

	let {
		value = $bindable(''),
		id = 'phone-input',
		required = false,
		disabled = false,
		placeholder = '37 00 1234',
		label = '',
		showLabel = false,
		showWhatsAppHint = true,
		lang = 'fr'
	}: {
		value?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		label?: string;
		showLabel?: boolean;
		showWhatsAppHint?: boolean;
		lang?: 'fr' | 'ht';
	} = $props();

	// Parse initial value or default
	let parsed = parsePhoneNumber(value);
	let selectedCountry = $state<Country>(parsed.country);
	let nationalDigits = $state(parsed.nationalNumber);

	let isOpen = $state(false);
	let searchQuery = $state('');
	let dropdownRef = $state<HTMLDivElement | null>(null);
	let searchInputRef = $state<HTMLInputElement | null>(null);

	// Filtered country list based on search
	let filteredCountries = $derived(
		searchQuery.trim() === ''
			? COUNTRIES
			: COUNTRIES.filter((c) => {
					const q = searchQuery.toLowerCase().trim();
					return (
						c.name.toLowerCase().includes(q) ||
						(c.nameHt && c.nameHt.toLowerCase().includes(q)) ||
						c.code.toLowerCase().includes(q) ||
						c.dialCode.includes(q)
					);
				})
	);

	// Format national number with spacing for display
	function formatNational(val: string): string {
		const digits = val.replace(/\D/g, '');
		if (digits.length <= 4) return digits;
		if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
		return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
	}

	// Synchronize outward E.164 formatted value whenever country or digits change
	$effect(() => {
		const cleanDigits = nationalDigits.replace(/\D/g, '');
		if (cleanDigits) {
			value = `${selectedCountry.dialCode}${cleanDigits}`;
		} else {
			value = '';
		}
	});

	// Synchronize inwards if value changes externally
	$effect(() => {
		if (value) {
			const p = parsePhoneNumber(value);
			if (p.country.code !== selectedCountry.code || p.nationalNumber !== nationalDigits) {
				selectedCountry = p.country;
				nationalDigits = p.nationalNumber;
			}
		}
	});

	function handleCountrySelect(country: Country) {
		selectedCountry = country;
		isOpen = false;
		searchQuery = '';
	}

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			setTimeout(() => {
				searchInputRef?.focus();
			}, 50);
		}
	}

	function handleBlurWindow(e: MouseEvent) {
		if (isOpen && dropdownRef && !dropdownRef.contains(e.target as Node)) {
			isOpen = false;
			searchQuery = '';
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
			searchQuery = '';
		}
	}
</script>

<svelte:window onclick={handleBlurWindow} onkeydown={handleKeyDown} />

<div class="space-y-1.5 w-full text-left" bind:this={dropdownRef}>
	{#if showLabel && label}
		<label for={id} class="text-xs font-bold text-zinc-700 ml-1 block">
			{label}
			{#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
		</label>
	{/if}

	<div class="relative flex items-center w-full rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-400/15 transition-all">
		<!-- Country Code Picker Button -->
		<button
			type="button"
			onclick={toggleDropdown}
			{disabled}
			class="flex items-center gap-1.5 px-3 py-3 rounded-l-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-r border-zinc-200 transition-colors font-medium text-xs sm:text-sm shrink-0 disabled:opacity-50"
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			aria-label="Sélectionner le pays"
		>
			<span class="text-lg leading-none">{selectedCountry.flag}</span>
			<span class="font-mono font-bold text-zinc-800">{selectedCountry.dialCode}</span>
			<ChevronDown size={14} class="text-zinc-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		</button>

		<!-- Input Field for Phone Digits -->
		<div class="relative flex-1 flex items-center">
			<input
				{id}
				type="tel"
				inputmode="tel"
				autocomplete="tel-national"
				{required}
				{disabled}
				placeholder={placeholder}
				value={formatNational(nationalDigits)}
				oninput={(e) => {
					nationalDigits = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '');
				}}
				class="w-full bg-transparent py-3 pl-3.5 pr-10 text-sm font-mono font-bold text-zinc-950 placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 outline-none transition-all disabled:opacity-60"
			/>
			
			<!-- WhatsApp indicator icon -->
			<div class="absolute right-3 pointer-events-none flex items-center" title="Numéro formaté pour WhatsApp">
				<img src="/whatsapp.png" alt="WhatsApp" class="size-5 object-contain shrink-0" />
			</div>
		</div>

		<!-- Country Dropdown List -->
		{#if isOpen}
			<div
				class="absolute top-full left-0 mt-1.5 w-72 sm:w-80 max-h-72 bg-white rounded-2xl shadow-2xl border border-zinc-200 z-[100] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
				role="listbox"
			>
				<!-- Search Header -->
				<div class="p-2 border-b border-zinc-100 bg-zinc-50/80 sticky top-0 z-10">
					<div class="relative flex items-center">
						<Search size={14} class="absolute left-3 text-zinc-400" />
						<input
							bind:this={searchInputRef}
							type="text"
							bind:value={searchQuery}
							placeholder={lang === 'ht' ? 'Chèche peyi oswa kòd...' : 'Rechercher un pays ou un code...'}
							class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-amber-400 text-zinc-900"
						/>
					</div>
				</div>

				<!-- Country Options Scrollable -->
				<div class="overflow-y-auto flex-1 divide-y divide-zinc-50 p-1">
					{#if filteredCountries.length === 0}
						<div class="p-4 text-center text-xs text-zinc-400">
							{lang === 'ht' ? 'Pa gen peyi ki jwenn' : 'Aucun pays trouvé'}
						</div>
					{:else}
						{#each filteredCountries as country (country.code + country.dialCode)}
							<button
								type="button"
								onclick={() => handleCountrySelect(country)}
								class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-50 text-left transition-colors text-xs text-zinc-800 {selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode ? 'bg-amber-100/60 font-bold text-amber-950' : ''}"
								role="option"
								aria-selected={selectedCountry.code === country.code}
							>
								<div class="flex items-center gap-2.5 min-w-0">
									<span class="text-xl leading-none shrink-0">{country.flag}</span>
									<span class="truncate">{lang === 'ht' && country.nameHt ? country.nameHt : country.name}</span>
								</div>
								<div class="flex items-center gap-2 shrink-0 ml-2">
									<span class="font-mono text-zinc-500 font-semibold">{country.dialCode}</span>
									{#if selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode}
										<Check size={14} class="text-amber-600" />
									{/if}
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>

</div>
