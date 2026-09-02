<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT } from '$env/static/public';
	import {
		Settings,
		Mail,
		Building,
		Globe,
		Clock,
		CreditCard,
		Save,
		Server,
		Activity,
		Image as ImageIcon,
		Upload,
		X,
		Loader2,
		AlertCircle,
		Sparkles,
		ShieldCheck,
		Wrench
	} from 'lucide-svelte';
	import { getPlatformSettings, updatePlatformSettings, type PlatformSettings } from '$lib/admin/admin-client';
	import { TIMEZONE_OPTIONS } from '$lib/coaching/timezone';
	import PhoneInput from '$lib/components/coaching/PhoneInput.svelte';
	import { toast } from '$lib/toast.svelte';

	let settings = $state<PlatformSettings>({
		siteName: '',
		tagline: '',
		contactEmail: '',
		whatsappNumber: '',
		timezone: 'America/Port-au-Prince',
		currency: 'HTG',
		maintenanceMode: false
	});
	let loading = $state(true);
	let saving = $state(false);
	let loadError = $state<string | null>(null);
	let logoFile = $state<File | null>(null);
	let logoPreview = $state<string | null>(null);

	onMount(loadSettings);

	async function loadSettings() {
		loading = true;
		loadError = null;
		try {
			settings = await getPlatformSettings();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Impossible de charger les paramètres.';
		} finally {
			loading = false;
		}
	}

	function selectLogo(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] || null;
		if (!file) return;
		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			toast.error('Le logo doit être au format PNG, JPG ou WEBP.');
			input.value = '';
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			toast.error('Le logo ne doit pas dépasser 2 Mo.');
			input.value = '';
			return;
		}
		if (logoPreview) URL.revokeObjectURL(logoPreview);
		logoFile = file;
		logoPreview = URL.createObjectURL(file);
	}

	function clearSelectedLogo() {
		if (logoPreview) URL.revokeObjectURL(logoPreview);
		logoFile = null;
		logoPreview = null;
	}

	async function saveSettings(event: SubmitEvent) {
		event.preventDefault();
		if (saving) return;
		saving = true;
		try {
			settings = await updatePlatformSettings(settings, logoFile);
			clearSelectedLogo();
			toast.success('Les paramètres généraux et le logo ont été enregistrés avec succès.');
		} catch (error) {
			console.error('Failed to save settings:', error);
			toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer les paramètres.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Paramètres généraux · DJR Akademi Admin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Page Header -->
	<header class="card bg-base-100 border border-base-300/70 shadow-xs p-6 sm:p-8">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
			<div class="flex items-start sm:items-center gap-4">
				<div class="grid size-12 place-items-center rounded-2xl bg-gradient-to-tr from-primary to-accent text-primary-content ring-4 ring-primary/10 shadow-md">
					<Settings size={26} />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">Paramètres généraux</h1>
						<span class="badge badge-primary badge-sm font-semibold text-[11px] gap-1 bg-primary/10 text-primary border-none">
							<Sparkles size={12} /> Plateforme
						</span>
					</div>
					<p class="mt-1 text-xs sm:text-sm text-base-content/60">
						Gérez l'identité visuelle, les coordonnées de contact et la localisation globale de votre plateforme.
					</p>
				</div>
			</div>
			<button
				form="settings-form"
				type="submit"
				disabled={saving || loading || !!loadError}
				class="btn btn-primary font-bold text-xs rounded-xl shadow-md min-h-11 px-6 gap-2"
			>
				{#if saving}
					<Loader2 size={16} class="animate-spin" />
					<span>Enregistrement…</span>
				{:else}
					<Save size={16} />
					<span>Enregistrer les modifications</span>
				{/if}
			</button>
		</div>
	</header>

	{#if loading}
		<div class="card bg-base-100 border border-base-300/70 p-16 text-center text-base-content/50 space-y-3">
			<Loader2 size={36} class="mx-auto animate-spin text-primary" />
			<p class="text-xs font-semibold">Chargement des paramètres de la plateforme...</p>
		</div>
	{:else if loadError}
		<div class="alert alert-error rounded-2xl shadow-sm border border-error/20 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<AlertCircle size={20} />
				<span class="text-xs font-semibold">{loadError}</span>
			</div>
			<button type="button" class="btn btn-sm btn-ghost font-bold rounded-xl" onclick={loadSettings}>
				Réessayer
			</button>
		</div>
	{:else}
		<form id="settings-form" onsubmit={saveSettings} class="space-y-6">
			<!-- Mode maintenance des achats -->
			<section class="card overflow-hidden border shadow-xs {settings.maintenanceMode ? 'border-warning/50 bg-warning/5' : 'border-base-300/70 bg-base-100'}">
				<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-start gap-3">
						<div class="grid size-9 shrink-0 place-items-center rounded-xl {settings.maintenanceMode ? 'bg-warning/20 text-warning-content' : 'bg-base-200 text-base-content/60'}">
							<Wrench size={18} />
						</div>
						<div>
							<h2 class="font-bold text-sm text-base-content">Maintenance des achats</h2>
							<p class="mt-1 max-w-2xl text-xs leading-relaxed text-base-content/60">
								Bloque temporairement les achats, les inscriptions gratuites et les réservations de coaching. Les contenus déjà achetés restent accessibles.
							</p>
						</div>
					</div>
					<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
						<span class="text-xs font-bold">{settings.maintenanceMode ? 'Activée' : 'Désactivée'}</span>
						<input class="toggle toggle-warning" type="checkbox" bind:checked={settings.maintenanceMode} />
					</label>
				</div>
				{#if settings.maintenanceMode}
					<div class="border-t border-warning/30 bg-warning/10 px-5 py-3 text-xs font-semibold text-warning-content">
						Les clients verront un message leur demandant de réessayer plus tard.
					</div>
				{/if}
			</section>

			<!-- Section 1: Logo de la plateforme -->
			<section class="card bg-base-100 border border-base-300/70 shadow-xs overflow-hidden">
				<div class="flex items-center gap-3 border-b border-base-300/70 p-5 bg-base-200/40">
					<div class="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
						<ImageIcon size={18} />
					</div>
					<div>
						<h2 class="font-bold text-sm text-base-content">Logo de la plateforme</h2>
						<p class="text-xs text-base-content/55">Formats acceptés : PNG, JPG ou WEBP — 2 Mo maximum.</p>
					</div>
				</div>
				<div class="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
					<div class="relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-base-300 bg-base-200/50 p-2 shadow-inner group">
						{#if logoPreview || settings.logoUrl}
							<img src={logoPreview || settings.logoUrl} alt="Aperçu du logo" class="size-full object-contain transition-transform group-hover:scale-105" />
						{:else}
							<div class="text-center space-y-1 text-base-content/40">
								<ImageIcon size={32} class="mx-auto" />
								<span class="text-[10px] font-semibold block">Aucun logo</span>
							</div>
						{/if}
					</div>

					<div class="space-y-3 flex-1">
						<div class="flex flex-wrap items-center gap-3">
							<label class="btn btn-outline btn-sm font-semibold rounded-xl text-xs gap-2 cursor-pointer" for="logo-input">
								<Upload size={15} /> Choisir une nouvelle image
							</label>
							<input id="logo-input" class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onchange={selectLogo} />

							{#if logoFile}
								<button type="button" class="btn btn-ghost btn-xs text-error font-semibold rounded-lg gap-1" onclick={clearSelectedLogo}>
									<X size={14} /> Annuler le logo sélectionné
								</button>
							{/if}
						</div>

						{#if logoFile}
							<div class="badge badge-neutral badge-sm font-mono text-[11px] gap-1.5 py-2 px-3">
								<span class="truncate max-w-xs">{logoFile.name}</span>
								<span class="text-base-content/50">({(logoFile.size / 1024).toFixed(0)} Ko)</span>
							</div>
						{/if}
						<p class="text-xs text-base-content/50 leading-relaxed">
							Ce logo sera affiché dans l'en-tête du site, les e-mails de confirmation et les reçus de paiement.
						</p>
					</div>
				</div>
			</section>

			<!-- Section 2: Identité de la marque -->
			<section class="card bg-base-100 border border-base-300/70 shadow-xs overflow-hidden">
				<div class="flex items-center gap-3 border-b border-base-300/70 p-5 bg-base-200/40">
					<div class="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
						<Building size={18} />
					</div>
					<div>
						<h2 class="font-bold text-sm text-base-content">Identité de la plateforme</h2>
						<p class="text-xs text-base-content/55">Nom officiel et slogan d'accroche de l'académie.</p>
					</div>
				</div>
				<div class="p-6 grid gap-5 sm:grid-cols-2">
					<label class="form-control w-full space-y-1.5">
						<span class="label-text font-bold text-xs text-base-content/70">Nom du site *</span>
						<input
							type="text"
							required
							maxlength="120"
							bind:value={settings.siteName}
							placeholder="Ex. DJR Akademi"
							class="input input-bordered w-full rounded-xl text-xs font-semibold text-base-content bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</label>

					<label class="form-control w-full space-y-1.5">
						<span class="label-text font-bold text-xs text-base-content/70">Slogan / Tagline</span>
						<input
							type="text"
							maxlength="240"
							bind:value={settings.tagline}
							placeholder="Ex. Plateforme de formation & coaching en ligne"
							class="input input-bordered w-full rounded-xl text-xs text-base-content bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</label>
				</div>
			</section>

			<!-- Section 3: Coordonnées de contact -->
			<section class="card bg-base-100 border border-base-300/70 shadow-xs overflow-hidden">
				<div class="flex items-center gap-3 border-b border-base-300/70 p-5 bg-base-200/40">
					<div class="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
						<Mail size={18} />
					</div>
					<div>
						<h2 class="font-bold text-sm text-base-content">Coordonnées & Contact</h2>
						<p class="text-xs text-base-content/55">Canaux utilisés pour l'assistance et les notifications clients.</p>
					</div>
				</div>
				<div class="p-6 grid gap-6 sm:grid-cols-2 items-end">
					<label class="form-control w-full space-y-1.5">
						<span class="label-text font-bold text-xs text-base-content/70 flex items-center gap-1.5">
							<Mail size={14} class="text-primary" /> Email de contact *
						</span>
						<input
							type="email"
							required
							maxlength="255"
							bind:value={settings.contactEmail}
							placeholder="contact@djrakademi.net"
							class="input input-bordered w-full rounded-xl text-xs font-medium text-base-content bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</label>

					<PhoneInput
						bind:value={settings.whatsappNumber}
						id="settings-whatsapp"
						required={true}
						label="Numéro WhatsApp Officiel"
						placeholder="+509 3700 1234"
					/>
				</div>
			</section>

			<!-- Section 4: Localisation & Devise -->
			<section class="card bg-base-100 border border-base-300/70 shadow-xs overflow-hidden">
				<div class="flex items-center gap-3 border-b border-base-300/70 p-5 bg-base-200/40">
					<div class="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
						<Globe size={18} />
					</div>
					<div>
						<h2 class="font-bold text-sm text-base-content">Fuseau horaire & Monnaie</h2>
						<p class="text-xs text-base-content/55">Région de référence pour les plannings et la facturation.</p>
					</div>
				</div>
				<div class="p-6 grid gap-5 sm:grid-cols-2">
					<label class="form-control w-full space-y-1.5">
						<span class="label-text font-bold text-xs text-base-content/70 flex items-center gap-1.5">
							<Clock size={14} class="text-primary" /> Fuseau horaire par défaut *
						</span>
						<select
							bind:value={settings.timezone}
							required
							class="select select-bordered w-full rounded-xl text-xs font-semibold text-base-content bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
						>
							{#each TIMEZONE_OPTIONS as tzOption}
								<option value={tzOption.value}>{tzOption.label}</option>
							{/each}
						</select>
					</label>

					<div class="form-control w-full space-y-1.5">
						<span class="label-text font-bold text-xs text-base-content/70 flex items-center gap-1.5">
							<CreditCard size={14} class="text-secondary" /> Devise principale
						</span>
						<div class="input input-bordered w-full rounded-xl text-xs font-bold text-base-content bg-base-200/60 border-base-300 flex items-center justify-between px-4">
							<span>{settings.currency || 'HTG'}</span>
							<span class="badge badge-sm font-semibold text-[10px] bg-base-300 text-base-content/60 border-none">
								Gourde Haïtienne
							</span>
						</div>
					</div>
				</div>
			</section>

			<!-- Section 5: Infrastructure & Santé Appwrite -->
			<section class="card bg-base-100 border border-base-300/70 shadow-xs overflow-hidden p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<div class="grid size-9 place-items-center rounded-xl bg-info/10 text-info">
							<Server size={18} />
						</div>
						<div>
							<h2 class="font-bold text-sm text-base-content">Infrastructure Appwrite</h2>
							<p class="text-xs text-base-content/55">État de la connexion backend et identifiants du projet.</p>
						</div>
					</div>
					<a href="/admin/health" class="btn btn-outline btn-sm font-semibold rounded-xl text-xs gap-1.5">
						<Activity size={14} class="text-success" /> Moniteur de santé
					</a>
				</div>

				<div class="grid gap-4 text-xs sm:grid-cols-2 mt-4">
					<div class="bg-base-200/50 border border-base-300/60 p-4 rounded-xl space-y-1.5">
						<dt class="text-base-content/55 font-bold uppercase tracking-wider text-[10px]">Endpoint Appwrite</dt>
						<dd class="font-mono font-bold text-xs text-base-content break-all flex items-center justify-between gap-2">
							<span>{PUBLIC_APPWRITE_ENDPOINT || 'Non configuré'}</span>
							<span class="badge badge-success badge-xs gap-1 font-semibold text-[10px] shrink-0">
								<ShieldCheck size={10} /> En ligne
							</span>
						</dd>
					</div>

					<div class="bg-base-200/50 border border-base-300/60 p-4 rounded-xl space-y-1.5">
						<dt class="text-base-content/55 font-bold uppercase tracking-wider text-[10px]">Identifiant du Projet</dt>
						<dd class="font-mono font-bold text-xs text-base-content flex items-center justify-between gap-2">
							<span>{PUBLIC_APPWRITE_PROJECT || 'Non configuré'}</span>
							<span class="badge badge-neutral badge-xs font-semibold text-[10px] shrink-0">
								Project ID
							</span>
						</dd>
					</div>
				</div>
			</section>
		</form>
	{/if}
</div>

