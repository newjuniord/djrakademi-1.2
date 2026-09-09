<script lang="ts">
	import { onMount } from 'svelte';
	import { CalendarOff, Loader2, Plus, Save, Trash2 } from 'lucide-svelte';
	import type { CoachingSettings, CoachingUnavailability } from '$lib/types/coaching';
	import {
		createCoachingUnavailability,
		deleteCoachingUnavailability,
		getCoachingUnavailability,
		updateCoachingSettings
	} from '$lib/services/coaching';
	import { toast } from '$lib/toast.svelte';
	import { zonedDateTimeToUtc } from '$lib/coaching/availability';

	let { serviceId, settings, onSettingsUpdated }: {
		serviceId: string;
		settings: CoachingSettings;
		onSettingsUpdated: (settings: CoachingSettings) => void;
	} = $props();

	const weekdayOptions = [
		{ value: 1, label: 'Lun' }, { value: 2, label: 'Mar' }, { value: 3, label: 'Mer' },
		{ value: 4, label: 'Jeu' }, { value: 5, label: 'Ven' }, { value: 6, label: 'Sam' }, { value: 0, label: 'Dim' }
	];
	let workingDays = $state<number[]>([]);
	let workStart = $state('09:00');
	let workEnd = $state('17:00');
	let breakDuration = $state(0);
	let noticeHours = $state(24);
	let maxAdvanceDays = $state(90);
	let unavailableDate = $state('');
	let reason = $state('');
	let unavailable = $state<CoachingUnavailability[]>([]);
	let loading = $state(true);
	let saving = $state(false);

	onMount(async () => {
		workingDays = [...settings.workingDays];
		workStart = settings.workStart;
		workEnd = settings.workEnd;
		breakDuration = settings.breakDuration;
		noticeHours = settings.noticeHours;
		maxAdvanceDays = settings.maxAdvanceDays;
		try { unavailable = await getCoachingUnavailability(serviceId); }
		catch { toast.error('Impossible de charger les indisponibilités.'); }
		finally { loading = false; }
	});

	function toggleDay(day: number) {
		workingDays = workingDays.includes(day) ? workingDays.filter((value) => value !== day) : [...workingDays, day];
	}

	async function saveSchedule() {
		if (!workingDays.length || workEnd <= workStart) {
			toast.error('Sélectionnez au moins un jour et une heure de fin postérieure au début.');
			return;
		}
		saving = true;
		try {
			const updated = await updateCoachingSettings({
				country: settings.country, timezone: settings.timezone, whatsapp: settings.whatsapp,
				workingDays, workStart, workEnd, breakDuration, noticeHours, maxAdvanceDays
			});
			onSettingsUpdated(updated);
			toast.success('Horaires de réservation enregistrés.');
		} catch (error: any) {
			toast.error(error?.message || 'Impossible d’enregistrer les horaires.');
		} finally { saving = false; }
	}

	async function addUnavailableDay() {
		if (!unavailableDate) return;
		const [year, month, day] = unavailableDate.split('-').map(Number);
		const start = zonedDateTimeToUtc(year, month, day, 0, 0, settings.timezone);
		const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
		const end = zonedDateTimeToUtc(nextDay.getUTCFullYear(), nextDay.getUTCMonth() + 1, nextDay.getUTCDate(), 0, 0, settings.timezone);
		try {
			const created = await createCoachingUnavailability(serviceId, start.toISOString(), end.toISOString(), reason.trim());
			unavailable = [...unavailable, created].sort((a, b) => a.startAt.localeCompare(b.startAt));
			unavailableDate = '';
			reason = '';
			toast.success('Journée d’absence ajoutée.');
		} catch (error: any) { toast.error(error?.message || 'Impossible d’ajouter cette absence.'); }
	}

	async function removeUnavailableDay(id: string) {
		try {
			await deleteCoachingUnavailability(id);
			unavailable = unavailable.filter((item) => item.id !== id);
			toast.success('Indisponibilité supprimée.');
		} catch { toast.error('Impossible de supprimer cette indisponibilité.'); }
	}
</script>

<div class="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
	<section class="rounded-xl border border-base-300 bg-base-100 p-5 sm:p-6">
		<h3 class="font-bold">Horaires récurrents</h3>
		<p class="mt-1 text-xs text-base-content/55">Ces règles génèrent automatiquement les créneaux dans le fuseau {settings.timezone}.</p>

		<div class="mt-5">
			<p class="mb-2 text-xs font-semibold text-base-content/70">Jours travaillés</p>
			<div class="flex flex-wrap gap-2">
				{#each weekdayOptions as day}
					<button type="button" class="btn btn-sm" class:btn-primary={workingDays.includes(day.value)} class:btn-ghost={!workingDays.includes(day.value)} onclick={() => toggleDay(day.value)}>{day.label}</button>
				{/each}
			</div>
		</div>

		<div class="mt-5 grid gap-4 sm:grid-cols-2">
			<label class="form-control"><span class="label-text mb-1.5 text-xs font-semibold">Début</span><input class="input input-bordered w-full" type="time" bind:value={workStart} /></label>
			<label class="form-control"><span class="label-text mb-1.5 text-xs font-semibold">Fin</span><input class="input input-bordered w-full" type="time" bind:value={workEnd} /></label>
			<label class="form-control"><span class="label-text mb-1.5 text-xs font-semibold">Pause entre séances (min)</span><input class="input input-bordered w-full" type="number" min="0" max="240" bind:value={breakDuration} /></label>
			<label class="form-control"><span class="label-text mb-1.5 text-xs font-semibold">Préavis minimum (heures)</span><input class="input input-bordered w-full" type="number" min="0" max="720" bind:value={noticeHours} /></label>
			<label class="form-control sm:col-span-2"><span class="label-text mb-1.5 text-xs font-semibold">Réservation jusqu’à (jours)</span><input class="input input-bordered w-full" type="number" min="1" max="365" bind:value={maxAdvanceDays} /></label>
		</div>
		<button class="btn btn-primary mt-5 gap-2" type="button" disabled={saving} onclick={saveSchedule}>
			{#if saving}<Loader2 size={17} class="animate-spin" />{:else}<Save size={17} />{/if}
			Enregistrer les horaires
		</button>
	</section>

	<section class="rounded-xl border border-base-300 bg-base-100 p-5 sm:p-6">
		<div class="flex items-center gap-2"><CalendarOff size={18} class="text-primary" /><h3 class="font-bold">Indisponibilités</h3></div>
		<p class="mt-1 text-xs text-base-content/55">Vacances, congés ou journées bloquées pour cette offre.</p>
		<div class="mt-4 space-y-3">
			<input class="input input-bordered w-full" type="date" bind:value={unavailableDate} min={new Date().toISOString().slice(0, 10)} />
			<input class="input input-bordered w-full" type="text" maxlength="255" placeholder="Motif (facultatif)" bind:value={reason} />
			<button class="btn btn-outline w-full gap-2" type="button" disabled={!unavailableDate} onclick={addUnavailableDay}><Plus size={16} /> Bloquer cette journée</button>
		</div>
		<div class="mt-5 divide-y divide-base-300">
			{#if loading}<div class="py-5 text-center"><Loader2 size={20} class="mx-auto animate-spin" /></div>
			{:else if !unavailable.length}<p class="py-5 text-center text-xs text-base-content/50">Aucune indisponibilité planifiée.</p>
			{:else}
				{#each unavailable as item}
					<div class="flex items-center justify-between gap-3 py-3">
						<div><p class="text-sm font-semibold">{new Date(item.startAt).toLocaleDateString('fr-FR')}</p>{#if item.reason}<p class="text-xs text-base-content/50">{item.reason}</p>{/if}</div>
						<button class="btn btn-ghost btn-square btn-sm text-error" type="button" aria-label="Supprimer" onclick={() => removeUnavailableDay(item.id)}><Trash2 size={16} /></button>
					</div>
				{/each}
			{/if}
		</div>
	</section>
</div>
