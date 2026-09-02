<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CheckCircle2,
		Globe2,
		Save,
		Clock,
		AlertCircle,
		Phone,
		Calendar,
		Sparkles,
		ShieldCheck,
		Loader2
	} from 'lucide-svelte';
	import PhoneInput from '$lib/components/coaching/PhoneInput.svelte';
	import TimezoneSelector from '$lib/components/coaching/TimezoneSelector.svelte';
	import { formatCurrentTime, getTimezoneLabel, isValidTimezone } from '$lib/coaching/timezone';
	import { isValidE164 } from '$lib/coaching/validation';
	import { getCoachingSettings, updateCoachingSettings } from '$lib/services/coaching';
	import { toast } from '$lib/toast.svelte';

	let country = $state('HT');
	let whatsapp = $state('+50937000000');
	let timezone = $state('America/Port-au-Prince');
	let timezoneOpen = $state(false);

	let currentTime = $state('');
	let timeSeoul = $state('');
	let timeParis = $state('');
	let timeNewYork = $state('');

	let detected = $state(false);
	let error = $state('');
	let saved = $state(false);
	let loading = $state(true);
	let saving = $state(false);

	function updateWorldClocks() {
		currentTime = formatCurrentTime(timezone);
		timeSeoul = formatCurrentTime('Asia/Seoul');
		timeParis = formatCurrentTime('Europe/Paris');
		timeNewYork = formatCurrentTime('America/New_York');
	}

	onMount(() => {
		getCoachingSettings()
			.then((s) => {
				country = s.country || 'HT';
				whatsapp = s.whatsapp || '+50937000000';
				if (s.timezone && isValidTimezone(s.timezone)) {
					timezone = s.timezone;
				} else {
					const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
					if (isValidTimezone(browserTimezone)) {
						timezone = browserTimezone;
					}
				}
			})
			.finally(() => {
				loading = false;
				detected = true;
				updateWorldClocks();
			});

		updateWorldClocks();
		const timer = window.setInterval(updateWorldClocks, 10_000);
		return () => window.clearInterval(timer);
	});

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saved = false;

		if (!isValidE164(whatsapp)) {
			error = 'Le numéro WhatsApp doit respecter le format international (+509..., +1..., +33...).';
			return;
		}

		if (!isValidTimezone(timezone)) {
			error = 'Le fuseau horaire sélectionné est invalide.';
			return;
		}

		error = '';
		saving = true;

		try {
			await updateCoachingSettings({
				country,
				timezone,
				whatsapp
			});
			toast.success('Paramètres de coaching enregistrés avec succès.');
			saved = true;
			setTimeout(() => {
				saved = false;
			}, 4000);
		} catch (e: any) {
			console.error('Failed to save settings:', e);
			error = e?.message || 'Erreur lors de la sauvegarde des paramètres dans Appwrite.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Paramètres Coaching · Administration</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8">
	<!-- Page Header -->
	<div>
		<div class="flex items-center gap-2 mb-1">
			<span class="badge badge-warning font-bold text-[10px] uppercase tracking-wider">Multi-Régions</span>
			<h2 class="text-2xl sm:text-3xl font-black text-base-content tracking-tight">Paramètres de Coaching</h2>
		</div>
		<p class="text-sm text-base-content/60">
			Configurez votre disponibilité horaire et vos coordonnées WhatsApp. Les réservations sont automatiquement adaptées au fuseau local de vos élèves en Amérique, Europe ou Asie.
		</p>
	</div>

	<!-- Notifications Alerts -->
	{#if saved}
		<div class="alert alert-success shadow-sm rounded-2xl">
			<CheckCircle2 size={20} />
			<span class="font-bold text-sm">Vos paramètres de coaching ont été enregistrés avec succès !</span>
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error shadow-sm rounded-2xl">
			<AlertCircle size={20} />
			<span class="font-bold text-sm">{error}</span>
		</div>
	{/if}

	<form class="space-y-6" onsubmit={save}>
		<!-- CARD 1: CONTACT WHATSAPP (MINIMALIST DESIGN) -->
		<div class="bg-base-100 p-6 border border-base-200 space-y-4 rounded-none">
			<div class="flex items-center justify-between pb-3 border-b border-base-200/60">
				<div>
					<h3 class="font-bold text-sm text-base-content">Contact WhatsApp Professionnel</h3>
					<p class="text-xs text-base-content/50 mt-0.5">Transmission automatique des liens de visioconférence et rappels clients.</p>
				</div>
			</div>

			<div class="max-w-md space-y-2">
				<label for="whatsapp" class="label-text font-semibold text-xs text-base-content/80">
					Numéro WhatsApp de l'instructeur
				</label>
				<PhoneInput bind:value={whatsapp} showLabel={false} />
			</div>
		</div>

		<!-- CARD 2: GESTION DES FUSEAUX HORAIRES (MULTI-CONTINENTS) -->
		<div class="card border border-base-300 bg-base-100 shadow-xs rounded-2xl overflow-hidden">
			<div class="card-body gap-6 p-6 sm:p-7">
				<div class="flex items-start justify-between gap-4 pb-4 border-b border-base-200/80">
					<div class="flex items-center gap-3.5">
						<div class="size-10 bg-indigo-500/10 text-indigo-600 rounded-2xl grid place-items-center font-bold ring-4 ring-indigo-500/5 shrink-0">
							<Globe2 size={19} />
						</div>
						<div>
							<h3 class="font-extrabold text-base text-base-content tracking-tight">Fuseau Horaire de Référence</h3>
							<p class="text-xs text-base-content/60 mt-0.5 font-medium">Conversion automatique en norme internationale UTC pour vos clients dans le monde entier</p>
						</div>
					</div>
					<span class="badge badge-ghost font-mono text-[10px] font-bold tracking-wider uppercase bg-base-200 shrink-0">IANA Standard</span>
				</div>

				<!-- Live Detected Info -->
				<div class="rounded-2xl bg-base-200/40 p-4 sm:p-5 border border-base-300/80 space-y-4 shadow-2xs">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<div class="flex items-center gap-2">
								<p class="text-[11px] text-base-content/60 font-bold uppercase tracking-wider">Votre fuseau actif :</p>
								{#if detected}
									<span class="badge badge-xs badge-success text-[10px] font-bold gap-1 px-2">
										<Sparkles size={10} /> Détecté
									</span>
								{/if}
							</div>
							<p class="text-base font-black text-base-content mt-0.5">
								{detected ? getTimezoneLabel(timezone) : 'Détection en cours…'}
							</p>
						</div>
						<div class="text-left sm:text-right">
							<p class="text-[11px] text-base-content/60 font-bold uppercase tracking-wider">Heure locale actuelle :</p>
							<p class="text-lg font-mono font-black text-primary tracking-tight">{currentTime || '—'}</p>
						</div>
					</div>

					<!-- Real-Time World Comparison Clock -->
					<div class="pt-3 border-t border-base-300/60">
						<p class="text-[11px] font-bold text-base-content/60 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
							<Clock size={13} class="text-primary" />
							<span>Aperçu en temps réel chez vos élèves :</span>
						</p>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs">
							<div class="p-3 bg-base-100 rounded-xl border border-base-300/80 shadow-2xs">
								<span class="block font-medium text-[11px] text-base-content/60">Amérique (NY / HT)</span>
								<span class="font-mono font-black text-sm text-base-content mt-0.5 block">{timeNewYork || '—'}</span>
							</div>
							<div class="p-3 bg-base-100 rounded-xl border border-base-300/80 shadow-2xs">
								<span class="block font-medium text-[11px] text-base-content/60">Europe (Paris)</span>
								<span class="font-mono font-black text-sm text-base-content mt-0.5 block">{timeParis || '—'}</span>
							</div>
							<div class="p-3 bg-base-100 rounded-xl border border-base-300/80 shadow-2xs">
								<span class="block font-medium text-[11px] text-base-content/60">Corée du Sud (Séoul)</span>
								<span class="font-mono font-black text-sm text-base-content mt-0.5 block">{timeSeoul || '—'}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Timezone Selector Component -->
				<TimezoneSelector bind:value={timezone} bind:open={timezoneOpen} />

				<div class="p-3.5 rounded-xl bg-base-200/50 border border-base-300/60 flex items-start gap-2.5">
					<ShieldCheck size={16} class="text-primary shrink-0 mt-0.5" />
					<p class="text-xs text-base-content/70 leading-relaxed font-medium">
						<strong>Gestion Automatique des Décalages :</strong> Tous vos créneaux sont enregistrés en norme UTC. Lorsque des clients réservent depuis la Corée du Sud, les États-Unis ou l'Europe, les heures s'adaptent instantanément à leur heure locale sans aucun risque d'erreur d'inattention.
					</p>
				</div>
			</div>
		</div>

		<!-- SUBMIT ACTION BAR -->
		<div class="flex items-center justify-end gap-4 pt-2">
			<button class="btn btn-primary min-h-12 px-8 rounded-xl font-bold gap-2 text-sm shadow-md" type="submit" disabled={saving}>
				{#if saving}
					<Loader2 size={18} class="animate-spin" />
					<span>Enregistrement en cours…</span>
				{:else}
					<Save size={18} />
					<span>Enregistrer les paramètres</span>
				{/if}
			</button>
		</div>
	</form>
</div>
