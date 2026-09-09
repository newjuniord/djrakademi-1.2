<script lang="ts">
	import { CalendarPlus, ChevronDown, Clock3, Plus, Trash2, X, Zap, Check, Sparkles, Loader2, Eye, CheckCircle2 } from 'lucide-svelte';
	import { formatDateTimeInTimezone, getTimezoneLabel, localDateTimeToUtc } from '$lib/coaching/timezone';
	import type { CoachingSlot } from '$lib/types/coaching';

	let { slots, timezone, serviceId, serviceDuration = 60, onAdd, onAddBatch, onDelete, onDeleteBatch }: {
		slots: CoachingSlot[];
		timezone: string;
		serviceId: string;
		serviceDuration?: number;
		onAdd: (slot: CoachingSlot) => void;
		onAddBatch?: (batch: { startAt: string; endAt: string }[]) => Promise<number>;
		onDelete: (id: string) => void;
		onDeleteBatch?: (ids: string[]) => Promise<void>;
	} = $props();

	let adding = $state(false);
	let mode = $state<'bulk' | 'single'>('bulk');
	let generatingBatch = $state(false);
	let showReviewModal = $state(false);
	let selectedSlotIds = $state<string[]>([]);
	let showBulkDeleteConfirm = $state(false);
	let deletingBatch = $state(false);

	// Single Slot State
	let date = $state(new Date().toISOString().slice(0, 10));
	let startTime = $state('14:00');
	let endTime = $state('15:00');
	let error = $state('');
	let showPast = $state(false);
	let minimumDate = new Date().toISOString().slice(0, 10);

	function getInitialEndDate() {
		const d = new Date();
		d.setDate(d.getDate() + 7);
		return d.toISOString().slice(0, 10);
	}

	// Bulk Slot Generator State
	let bulkStartDate = $state(new Date().toISOString().slice(0, 10));
	let bulkEndDate = $state(getInitialEndDate());
	// Days selected: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
	let selectedDays = $state<number[]>([1, 2, 3, 4, 5]);
	let bulkWorkStart = $state('09:00');
	let bulkWorkEnd = $state('17:00');
	let bulkSlotDuration = $state(60);
	let bulkBreakDuration = $state(0);

	$effect(() => {
		if (serviceDuration) {
			bulkSlotDuration = serviceDuration;
		}
	});

	let visibleSlots = $derived(showPast ? slots : slots.filter((slot) => slot.status !== 'cancelled'));
	let availableCount = $derived(slots.filter((slot) => slot.status === 'available').length);

	const daysMap = [
		{ id: 1, label: 'Lun', full: 'Lundi' },
		{ id: 2, label: 'Mar', full: 'Mardi' },
		{ id: 3, label: 'Mer', full: 'Mercredi' },
		{ id: 4, label: 'Jeu', full: 'Jeudi' },
		{ id: 5, label: 'Ven', full: 'Vendredi' },
		{ id: 6, label: 'Sam', full: 'Samedi' },
		{ id: 0, label: 'Dim', full: 'Dimanche' }
	];

	function toggleDay(dayId: number) {
		if (selectedDays.includes(dayId)) {
			selectedDays = selectedDays.filter((d) => d !== dayId);
		} else {
			selectedDays = [...selectedDays, dayId];
		}
	}

	function setPresetDays(type: 'workdays' | 'weekend' | 'all') {
		if (type === 'workdays') selectedDays = [1, 2, 3, 4, 5];
		else if (type === 'weekend') selectedDays = [6, 0];
		else selectedDays = [1, 2, 3, 4, 5, 6, 0];
	}

	function setPresetDateRange(days: number) {
		const cappedDays = Math.min(days, 190);
		const start = bulkStartDate ? new Date(bulkStartDate) : new Date();
		const baseStart = isNaN(start.getTime()) ? new Date() : start;
		bulkStartDate = baseStart.toISOString().slice(0, 10);
		const end = new Date(baseStart);
		end.setDate(end.getDate() + cappedDays);
		bulkEndDate = end.toISOString().slice(0, 10);
	}

	let maximumEndDate = $derived.by(() => {
		if (!bulkStartDate) return undefined;
		const parts = bulkStartDate.split('-').map(Number);
		if (parts.length !== 3) return undefined;
		const start = new Date(parts[0], parts[1] - 1, parts[2]);
		if (isNaN(start.getTime())) return undefined;
		start.setDate(start.getDate() + 190);
		return start.toISOString().slice(0, 10);
	});

	$effect(() => {
		if (maximumEndDate && bulkEndDate && bulkEndDate > maximumEndDate) {
			bulkEndDate = maximumEndDate;
		}
	});

	function formatHumanDate(dateStr: string) {
		if (!dateStr) return '...';
		const parts = dateStr.split('-');
		if (parts.length !== 3) return dateStr;
		const year = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10) - 1;
		const day = parseInt(parts[2], 10);
		const d = new Date(year, month, day);
		if (isNaN(d.getTime())) return dateStr;
		const today = new Date();
		const isToday =
			d.getFullYear() === today.getFullYear() &&
			d.getMonth() === today.getMonth() &&
			d.getDate() === today.getDate();
		const formatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
		return isToday ? `aujourd’hui (${formatted})` : formatted;
	}

	// Calculate generated slots in real-time
	let calculatedBatch = $derived.by(() => {
		if (!bulkStartDate || !bulkEndDate || selectedDays.length === 0) return [];
		const start = new Date(bulkStartDate);
		const end = new Date(bulkEndDate);
		if (start > end) return [];

		const result: { dateStr: string; startAt: string; endAt: string; startFormatted: string; endFormatted: string }[] = [];
		const existingStartTimes = new Set(slots.map((s) => s.startAt));

		const [startH, startM] = bulkWorkStart.split(':').map(Number);
		const [endH, endM] = bulkWorkEnd.split(':').map(Number);

		const workStartMinutes = startH * 60 + startM;
		const workEndMinutes = endH * 60 + endM;
		const duration = Number(bulkSlotDuration);
		const breakMins = Number(bulkBreakDuration);

		if (duration <= 0 || workStartMinutes >= workEndMinutes) return [];

		const curr = new Date(start);
		const nowTime = new Date().getTime();

		while (curr <= end) {
			const dayOfWeek = curr.getDay();
			if (selectedDays.includes(dayOfWeek)) {
				const dateStr = curr.toISOString().slice(0, 10);

				let currentMins = workStartMinutes;
				while (currentMins + duration <= workEndMinutes) {
					const sH = String(Math.floor(currentMins / 60)).padStart(2, '0');
					const sM = String(currentMins % 60).padStart(2, '0');
					const slotStartStr = `${sH}:${sM}`;

					const endMins = currentMins + duration;
					const eH = String(Math.floor(endMins / 60)).padStart(2, '0');
					const eM = String(endMins % 60).padStart(2, '0');
					const slotEndStr = `${eH}:${eM}`;

					const startAtUtc = localDateTimeToUtc(dateStr, slotStartStr, timezone);
					const endAtUtc = localDateTimeToUtc(dateStr, slotEndStr, timezone);

					if (startAtUtc && endAtUtc) {
						const startTimeMs = new Date(startAtUtc).getTime();
						if (startTimeMs > nowTime && !existingStartTimes.has(startAtUtc)) {
							result.push({
								dateStr,
								startAt: startAtUtc,
								endAt: endAtUtc,
								startFormatted: slotStartStr,
								endFormatted: slotEndStr
							});
						}
					}

					currentMins += duration + breakMins;
				}
			}
			curr.setDate(curr.getDate() + 1);
		}

		return result;
	});

	let activeDaysLabel = $derived(
		selectedDays
			.map((id) => daysMap.find((d) => d.id === id)?.full)
			.filter(Boolean)
			.join(', ')
	);

	function addSlot() {
		const startAt = localDateTimeToUtc(date, startTime, timezone);
		const endAt = localDateTimeToUtc(date, endTime, timezone);
		if (!startAt || !endAt || new Date(startAt) >= new Date(endAt)) {
			error = 'Choisissez une date et une plage horaire valides.';
			return;
		}
		if (new Date(startAt) <= new Date()) {
			error = 'Le créneau doit être dans le futur.';
			return;
		}
		error = '';
		onAdd({ id: `slot-${Date.now()}`, serviceId, startAt, endAt, coachTimezone: timezone, status: 'available', createdAt: new Date().toISOString() });
		adding = false;
	}

	async function handleBulkSubmit() {
		if (calculatedBatch.length === 0 || !onAddBatch || generatingBatch) return;
		generatingBatch = true;
		try {
			const batchPayload = calculatedBatch.map((item) => ({
				startAt: item.startAt,
				endAt: item.endAt
			}));
			await onAddBatch(batchPayload);
			showReviewModal = false;
			adding = false;
		} finally {
			generatingBatch = false;
		}
	}

	let availableSlots = $derived(visibleSlots.filter((s) => s.status === 'available'));
	let allAvailableSelected = $derived(
		availableSlots.length > 0 && availableSlots.every((s) => selectedSlotIds.includes(s.id))
	);

	function toggleSelectSlot(id: string) {
		if (selectedSlotIds.includes(id)) {
			selectedSlotIds = selectedSlotIds.filter((item) => item !== id);
		} else {
			selectedSlotIds = [...selectedSlotIds, id];
		}
	}

	function toggleSelectAllAvailable() {
		if (allAvailableSelected) {
			selectedSlotIds = [];
		} else {
			selectedSlotIds = availableSlots.map((s) => s.id);
		}
	}

	async function handleConfirmBulkDelete() {
		if (selectedSlotIds.length === 0 || deletingBatch) return;
		deletingBatch = true;
		try {
			if (onDeleteBatch) {
				await onDeleteBatch(selectedSlotIds);
			} else {
				for (const id of selectedSlotIds) {
					await onDelete(id);
				}
			}
			selectedSlotIds = [];
			showBulkDeleteConfirm = false;
		} finally {
			deletingBatch = false;
		}
	}
</script>

<section class="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xs">
	<div class="flex flex-col gap-4 border-b border-base-300 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
		<div>
			<h3 class="text-lg font-bold tracking-tight text-base-content">Créneaux disponibles</h3>
			<p class="mt-0.5 text-xs text-base-content/55">Planifiez rapidement vos plages horaires de coaching.</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				class="btn btn-primary min-h-11 rounded-xl font-bold text-xs gap-2 shadow-xs"
				type="button"
				onclick={() => { adding = !adding; error = ''; }}
			>
				{#if adding}
					<X size={16} /> Fermer
				{:else}
					<Zap size={16} class="text-amber-300 fill-amber-300" />
					Générer des créneaux
				{/if}
			</button>
		</div>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 bg-base-200/35 px-5 py-3 sm:px-6">
		<div class="flex items-center gap-3">
			{#if availableSlots.length > 0}
				<label class="flex items-center gap-2 text-xs font-bold text-base-content/70 cursor-pointer select-none">
					<input
						type="checkbox"
						class="checkbox checkbox-primary checkbox-sm rounded-md"
						checked={allAvailableSelected}
						onchange={toggleSelectAllAvailable}
					/>
					<span>Tout sélectionner ({availableSlots.length})</span>
				</label>
			{/if}
			<p class="flex items-center gap-2 text-xs text-base-content/60 border-l border-base-300 pl-3">
				<Clock3 size={15} />
				<span>Fuseau horaire : <strong class="text-base-content font-bold">{getTimezoneLabel(timezone)}</strong></span>
			</p>
		</div>
		<div class="flex items-center gap-3">
			{#if selectedSlotIds.length > 0}
				<button
					type="button"
					class="btn btn-error btn-xs font-extrabold gap-1.5 rounded-lg px-3 shadow-xs"
					onclick={() => (showBulkDeleteConfirm = true)}
				>
					<Trash2 size={13} />
					Supprimer la sélection ({selectedSlotIds.length})
				</button>
			{/if}
			<p class="text-xs text-base-content/50 font-semibold">{availableCount} disponible{availableCount > 1 ? 's' : ''} sur {slots.length} au total</p>
		</div>
	</div>

	{#if adding}
		<div class="border-b border-base-300 bg-base-200/20 p-5 sm:p-7 space-y-6">
			<!-- Mode Selector Tabs -->
			<div class="flex items-center gap-2 p-1 bg-base-200 rounded-xl w-fit">
				<button
					type="button"
					class="px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 {mode === 'bulk' ? 'bg-base-100 text-primary shadow-xs' : 'text-base-content/60 hover:text-base-content'}"
					onclick={() => (mode = 'bulk')}
				>
					<Zap size={14} class={mode === 'bulk' ? 'text-amber-500 fill-amber-500' : ''} />
					<span>Générateur en masse (Recommandé)</span>
				</button>
				<button
					type="button"
					class="px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 {mode === 'single' ? 'bg-base-100 text-primary shadow-xs' : 'text-base-content/60 hover:text-base-content'}"
					onclick={() => (mode = 'single')}
				>
					<Plus size={14} />
					<span>Créneau unique (1 par 1)</span>
				</button>
			</div>

			{#if mode === 'bulk'}
				<!-- Bulk Generator Form -->
				<div class="space-y-6 bg-base-100 p-5 sm:p-6 rounded-2xl border border-base-300/80 shadow-xs">
					<!-- Step 1: Date Range -->
					<div class="space-y-3">
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<span class="text-xs font-extrabold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
								<span class="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-black grid place-items-center">1</span>
								Période de réservation (Max 190 jours)
							</span>
							<div class="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
								<button type="button" class="px-2 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors cursor-pointer" onclick={() => setPresetDateRange(7)}>+7j</button>
								<button type="button" class="px-2 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors cursor-pointer" onclick={() => setPresetDateRange(14)}>+14j</button>
								<button type="button" class="px-2 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors cursor-pointer" onclick={() => setPresetDateRange(30)}>+30j</button>
								<button type="button" class="px-2 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors cursor-pointer" onclick={() => setPresetDateRange(60)}>+60j</button>
								<button type="button" class="px-2 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors cursor-pointer" onclick={() => setPresetDateRange(90)}>+90j</button>
								<button type="button" class="px-2.5 py-1 bg-primary/15 text-primary hover:bg-primary/20 rounded-lg transition-colors font-extrabold cursor-pointer" onclick={() => setPresetDateRange(190)}>+190j (Max)</button>
							</div>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<label class="form-control">
								<span class="label pb-1 text-xs font-bold text-base-content/70">Date de début</span>
								<input class="input input-bordered input-sm bg-base-100 rounded-xl font-bold text-xs" type="date" min={minimumDate} bind:value={bulkStartDate} />
								<span class="text-[11px] text-base-content/50 font-medium mt-1">Jour d’ouverture des réservations</span>
							</label>
							<label class="form-control">
								<span class="label pb-1 text-xs font-bold text-base-content/70">Date de fin</span>
								<input class="input input-bordered input-sm bg-base-100 rounded-xl font-bold text-xs" type="date" min={bulkStartDate} max={maximumEndDate} bind:value={bulkEndDate} />
								<span class="text-[11px] text-base-content/50 font-medium mt-1">Dernier jour (jusqu’à 190 jours max)</span>
							</label>
						</div>

						<!-- Dynamic Beginner-Friendly UX Explanation Banner -->
						<div class="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-base-content space-y-1">
							<div class="flex items-center gap-2 text-primary font-extrabold text-xs">
								<Sparkles size={15} class="fill-primary/20" />
								<span>Explication simple (en un coup d’œil) :</span>
							</div>
							<p class="text-xs font-medium leading-relaxed text-base-content/80">
								Vos créneaux seront automatiquement créés du <strong class="text-base-content font-bold">{formatHumanDate(bulkStartDate)}</strong> au <strong class="text-base-content font-bold">{formatHumanDate(bulkEndDate)}</strong> (chaque jour sélectionné de <strong class="text-base-content font-bold">{bulkWorkStart}</strong> à <strong class="text-base-content font-bold">{bulkWorkEnd}</strong>).
							</p>
						</div>
					</div>

					<!-- Step 2: Days of the week -->
					<div class="space-y-3 pt-3 border-t border-base-200">
						<div class="flex items-center justify-between">
							<span class="text-xs font-extrabold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
								<span class="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-black grid place-items-center">2</span>
								Jours actifs de la semaine
							</span>
							<div class="flex items-center gap-1.5 text-[11px] font-bold">
								<button type="button" class="px-2.5 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors" onclick={() => setPresetDays('workdays')}>Lun-Ven</button>
								<button type="button" class="px-2.5 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors" onclick={() => setPresetDays('weekend')}>Week-end</button>
								<button type="button" class="px-2.5 py-1 bg-base-200 hover:bg-base-300 rounded-lg transition-colors" onclick={() => setPresetDays('all')}>Tous les jours</button>
							</div>
						</div>

						<div class="flex flex-wrap gap-2">
							{#each daysMap as day}
								{@const active = selectedDays.includes(day.id)}
								<button
									type="button"
									onclick={() => toggleDay(day.id)}
									class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border {active ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs' : 'bg-base-100 text-base-content/60 border-base-300 hover:border-base-content/40'}"
								>
									{#if active}<Check size={13} class="text-amber-400" />{/if}
									<span>{day.full}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Step 3: Working Hours & Durations -->
					<div class="space-y-3 pt-3 border-t border-base-200">
						<span class="text-xs font-extrabold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
							<span class="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-black grid place-items-center">3</span>
							Horaire quotidien & Durées
						</span>

						<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
							<label class="form-control">
								<span class="label pb-1.5 text-xs font-bold text-base-content/70">Heure début</span>
								<input class="input input-bordered input-sm bg-base-100 rounded-xl font-bold text-xs" type="time" bind:value={bulkWorkStart} />
							</label>
							<label class="form-control">
								<span class="label pb-1.5 text-xs font-bold text-base-content/70">Heure fin</span>
								<input class="input input-bordered input-sm bg-base-100 rounded-xl font-bold text-xs" type="time" bind:value={bulkWorkEnd} />
							</label>
							<label class="form-control">
								<span class="label pb-1.5 text-xs font-bold text-base-content/70">Durée (min)</span>
								<select class="select select-bordered select-sm bg-base-100 rounded-xl font-bold text-xs" bind:value={bulkSlotDuration}>
									<option value={30}>30 min</option>
									<option value={45}>45 min</option>
									<option value={60}>60 min (1h)</option>
									<option value={90}>90 min (1h30)</option>
									<option value={120}>120 min (2h)</option>
								</select>
							</label>
							<label class="form-control">
								<span class="label pb-1.5 text-xs font-bold text-base-content/70">Pause (min)</span>
								<select class="select select-bordered select-sm bg-base-100 rounded-xl font-bold text-xs" bind:value={bulkBreakDuration}>
									<option value={0}>Sans pause (0 min)</option>
									<option value={15}>15 min de pause</option>
									<option value={30}>30 min de pause</option>
									<option value={60}>60 min de pause</option>
								</select>
							</label>
						</div>
					</div>

					<!-- Calculation Summary & Action Button -->
					<div class="pt-4 border-t border-base-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<Zap size={16} class="text-amber-500 fill-amber-500" />
								<span class="font-black text-sm text-base-content">
									{calculatedBatch.length} créneau{calculatedBatch.length > 1 ? 'x' : ''} prêt{calculatedBatch.length > 1 ? 's' : ''} à être généré{calculatedBatch.length > 1 ? 's' : ''}
								</span>
							</div>
							<p class="text-xs text-base-content/60 font-medium">
								{#if calculatedBatch.length > 0}
									Les créneaux en double ou passés sont automatiquement filtrés.
								{:else}
									Ajustez les paramètres ci-dessus pour calculer les créneaux.
								{/if}
							</p>
						</div>

						<button
							type="button"
							class="btn btn-primary min-h-12 rounded-xl font-extrabold text-xs gap-2 px-6 shadow-md shrink-0 cursor-pointer"
							disabled={calculatedBatch.length === 0 || generatingBatch}
							onclick={() => (showReviewModal = true)}
						>
							{#if generatingBatch}
								<Loader2 size={16} class="animate-spin" />
								<span>Génération en cours…</span>
							{:else}
								<Eye size={16} class="text-amber-300" />
								<span>Revoir & Générer ({calculatedBatch.length} créneaux)</span>
							{/if}
						</button>
					</div>
				</div>
			{:else}
				<!-- Single Slot Form -->
				<div class="bg-base-100 p-5 sm:p-6 rounded-2xl border border-base-300/80 shadow-xs space-y-4">
					<div>
						<h4 class="font-bold text-sm text-base-content">Nouveau créneau individuel</h4>
						<p class="text-xs text-base-content/55 mt-0.5">Saisissez l’heure exacte dans votre fuseau local.</p>
					</div>

					<div class="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
						<label class="form-control">
							<span class="label pb-1.5 text-xs font-bold text-base-content/70">Date</span>
							<input class="input input-bordered input-sm bg-base-100 rounded-xl font-bold text-xs" type="date" min={minimumDate} bind:value={date} />
						</label>
						<label class="form-control">
							<span class="label pb-1.5 text-xs font-bold text-base-content/70">Heure de début</span>
							<input class="input input-bordered input-sm bg-base-100 rounded-xl font-bold text-xs" type="time" bind:value={startTime} />
						</label>
						<label class="form-control">
							<span class="label pb-1.5 text-xs font-bold text-base-content/70">Heure de fin</span>
							<input class="input input-bordered input-sm bg-base-100 rounded-xl font-bold text-xs" type="time" bind:value={endTime} />
						</label>
						<button class="btn btn-primary min-h-11 rounded-xl font-bold text-xs gap-1.5 px-5" type="button" onclick={addSlot}>
							<CalendarPlus size={16} /> Ajouter
						</button>
					</div>
					{#if error}<p class="text-xs font-bold text-error mt-2">{error}</p>{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Slots List Render -->
	<div>
		{#each visibleSlots as slot (slot.id)}
			{@const formatted = formatDateTimeInTimezone(slot.startAt, timezone)}
			{@const end = formatDateTimeInTimezone(slot.endAt, timezone)}
			{@const isSelected = selectedSlotIds.includes(slot.id)}
			<div class="flex items-center gap-3 border-b border-base-300 px-4 py-4 last:border-b-0 sm:gap-4 sm:px-6 transition-colors {isSelected ? 'bg-primary/5' : 'hover:bg-base-200/20'}">
				{#if slot.status === 'available'}
					<input
						type="checkbox"
						class="checkbox checkbox-primary checkbox-sm rounded-md shrink-0 cursor-pointer"
						checked={isSelected}
						onchange={() => toggleSelectSlot(slot.id)}
						aria-label="Sélectionner ce créneau"
					/>
				{:else}
					<div class="size-5 shrink-0"></div>
				{/if}
				<div class="grid size-10 shrink-0 place-items-center rounded-xl border border-base-300 bg-base-200/50 text-primary">
					<CalendarPlus size={18} />
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-xs sm:text-sm font-bold capitalize text-base-content">{formatted.date}</p>
					<p class="mt-0.5 text-xs text-base-content/55 font-medium">{formatted.time} – {end.time}</p>
				</div>
				<span class={`badge badge-sm hidden sm:inline-flex font-bold ${slot.status === 'available' ? 'badge-success badge-soft' : slot.status === 'booked' ? 'badge-primary badge-soft' : 'badge-ghost'}`}>
					{slot.status === 'available' ? 'Disponible' : slot.status === 'booked' ? 'Réservé' : 'Annulé'}
				</span>
				<button
					class="btn btn-ghost btn-square btn-sm text-base-content/40 hover:text-error rounded-lg"
					type="button"
					disabled={slot.status === 'booked'}
					title={slot.status === 'booked' ? 'Un créneau réservé ne peut pas être supprimé' : 'Supprimer le créneau'}
					aria-label="Supprimer ce créneau"
					onclick={() => onDelete(slot.id)}
				>
					<Trash2 size={16} />
				</button>
			</div>
		{:else}
			<div class="grid place-items-center px-5 py-14 text-center">
				<span class="grid size-14 place-items-center rounded-2xl bg-base-200 text-base-content/40 mb-3">
					<CalendarPlus size={24} />
				</span>
				<p class="font-bold text-base text-base-content">Aucun créneau planifié</p>
				<p class="mt-1 max-w-sm text-xs text-base-content/50 font-medium">
					Générez vos créneaux en masse ou ajoutez-en individuellement pour permettre aux clients de réserver.
				</p>
				<button class="btn btn-primary btn-sm mt-4 rounded-xl font-bold gap-1.5" type="button" onclick={() => (adding = true)}>
					<Zap size={15} class="text-amber-300 fill-amber-300" /> Générer des créneaux
				</button>
			</div>
		{/each}
	</div>

	{#if slots.some((slot) => slot.status === 'cancelled')}
		<button
			class="flex min-h-11 w-full items-center justify-center gap-2 border-t border-base-300 text-xs font-semibold text-base-content/55 hover:bg-base-200/40 transition-colors"
			type="button"
			onclick={() => (showPast = !showPast)}
		>
			{showPast ? 'Masquer' : 'Afficher'} les créneaux annulés
			<ChevronDown class={`transition-transform ${showPast ? 'rotate-180' : ''}`} size={15} />
		</button>
	{/if}
</section>

{#if showReviewModal}
	<div class="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
		<div class="modal-box max-w-2xl space-y-5 rounded-3xl p-6 sm:p-8">
			<button
				class="btn btn-ghost btn-sm btn-circle absolute right-4 top-4"
				type="button"
				aria-label="Fermer"
				onclick={() => (showReviewModal = false)}
			>
				<X size={18} />
			</button>

			<!-- Header -->
			<div class="flex items-center gap-3.5 border-b border-base-200 pb-4">
				<div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
					<Sparkles size={24} />
				</div>
				<div>
					<h3 id="review-modal-title" class="text-lg font-bold text-base-content">
						Révision du planning avant création
					</h3>
					<p class="text-xs text-base-content/60 font-medium">
						Vérifiez la liste exacte des créneaux qui vont être générés.
					</p>
				</div>
			</div>

			<!-- Configuration Summary Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-base-200 bg-base-200/40 p-4 text-xs">
				<div>
					<span class="text-[11px] font-bold uppercase tracking-wider text-base-content/50 block">Période</span>
					<p class="font-bold text-base-content mt-0.5">
						Du {formatHumanDate(bulkStartDate)} au {formatHumanDate(bulkEndDate)}
					</p>
				</div>
				<div>
					<span class="text-[11px] font-bold uppercase tracking-wider text-base-content/50 block">Jours sélectionnés</span>
					<p class="font-bold text-base-content mt-0.5">
						{activeDaysLabel || 'Aucun jour'}
					</p>
				</div>
				<div>
					<span class="text-[11px] font-bold uppercase tracking-wider text-base-content/50 block">Plage horaire</span>
					<p class="font-bold text-base-content mt-0.5">
						De {bulkWorkStart} à {bulkWorkEnd} ({bulkSlotDuration} min / créneau{bulkBreakDuration ? `, pause: ${bulkBreakDuration} min` : ''})
					</p>
				</div>
				<div>
					<span class="text-[11px] font-bold uppercase tracking-wider text-base-content/50 block">Total à publier</span>
					<p class="font-black text-primary text-sm mt-0.5">
						{calculatedBatch.length} créneau{calculatedBatch.length > 1 ? 'x' : ''} prêt{calculatedBatch.length > 1 ? 's' : ''} à être généré{calculatedBatch.length > 1 ? 's' : ''}
					</p>
				</div>
			</div>

			<!-- Calculated Slots Scrollable Preview List -->
			<div class="space-y-2">
				<div class="flex items-center justify-between px-1">
					<span class="text-xs font-bold text-base-content/70">Aperçu détaillé des créneaux :</span>
					<span class="text-[11px] font-semibold text-base-content/50">{calculatedBatch.length} créneau{calculatedBatch.length > 1 ? 'x' : ''} au total</span>
				</div>

				<div class="max-h-60 overflow-y-auto rounded-2xl border border-base-200 bg-base-100 p-2 space-y-1.5 divide-y divide-base-200/60">
					{#each calculatedBatch as slot, idx}
						<div class="flex items-center justify-between px-3 py-2 text-xs">
							<div class="flex items-center gap-2.5">
								<span class="size-5 rounded-full bg-base-200 text-base-content/60 text-[10px] font-bold grid place-items-center">{idx + 1}</span>
								<span class="font-bold text-base-content capitalize">{formatHumanDate(slot.dateStr)}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="font-extrabold text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-lg text-[11px]">
									{slot.startFormatted} – {slot.endFormatted}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Modal Footer Actions -->
			<div class="modal-action border-t border-base-200 pt-4">
				<button
					type="button"
					class="btn btn-ghost rounded-xl text-xs font-bold"
					disabled={generatingBatch}
					onclick={() => (showReviewModal = false)}
				>
					Modifier les critères
				</button>
				<button
					type="button"
					class="btn btn-primary rounded-xl font-extrabold text-xs gap-2 px-6 shadow-md cursor-pointer"
					disabled={generatingBatch || calculatedBatch.length === 0}
					onclick={handleBulkSubmit}
				>
					{#if generatingBatch}
						<Loader2 size={16} class="animate-spin" />
						<span>Génération en cours…</span>
					{:else}
						<CheckCircle2 size={16} />
						<span>Confirmer & Générer les {calculatedBatch.length} créneaux</span>
					{/if}
				</button>
			</div>
		</div>
		<button class="modal-backdrop" type="button" aria-label="Fermer" onclick={() => (showReviewModal = false)}>close</button>
	</div>
{/if}

{#if showBulkDeleteConfirm}
	<div class="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="bulk-delete-title">
		<div class="modal-box max-w-md space-y-4 rounded-3xl p-6">
			<button
				class="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
				type="button"
				aria-label="Fermer"
				onclick={() => (showBulkDeleteConfirm = false)}
			>
				<X size={18} />
			</button>

			<div class="flex items-center gap-3.5">
				<div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-error/10 text-error">
					<Trash2 size={24} />
				</div>
				<div>
					<h3 id="bulk-delete-title" class="text-lg font-bold text-base-content">
						Confirmer la suppression
					</h3>
					<p class="text-xs text-base-content/60 font-medium">
						{selectedSlotIds.length} créneau{selectedSlotIds.length > 1 ? 'x' : ''} sélectionné{selectedSlotIds.length > 1 ? 's' : ''}
					</p>
				</div>
			</div>

			<div class="rounded-2xl border border-error/20 bg-error/5 p-4 text-xs space-y-1">
				<p class="font-extrabold text-error">Attention :</p>
				<p class="text-xs font-medium leading-relaxed text-base-content/80">
					Vous allez supprimer définitivement <strong class="text-base-content font-bold">{selectedSlotIds.length} créneau{selectedSlotIds.length > 1 ? 'x' : ''} de disponibilité</strong> de votre planning. Les créneaux déjà réservés par des apprenants ne seront pas modifiés.
				</p>
			</div>

			<div class="modal-action border-t border-base-200 pt-4">
				<button
					type="button"
					class="btn btn-ghost rounded-xl text-xs font-bold"
					disabled={deletingBatch}
					onclick={() => (showBulkDeleteConfirm = false)}
				>
					Annuler
				</button>
				<button
					type="button"
					class="btn btn-error rounded-xl font-extrabold text-xs gap-2 px-5 cursor-pointer"
					disabled={deletingBatch || selectedSlotIds.length === 0}
					onclick={handleConfirmBulkDelete}
				>
					{#if deletingBatch}
						<Loader2 size={16} class="animate-spin" />
						<span>Suppression en cours…</span>
					{:else}
						<Trash2 size={16} />
						<span>Supprimer les {selectedSlotIds.length} créneaux</span>
					{/if}
				</button>
			</div>
		</div>
		<button class="modal-backdrop" type="button" aria-label="Fermer" onclick={() => (showBulkDeleteConfirm = false)}>close</button>
	</div>
{/if}
