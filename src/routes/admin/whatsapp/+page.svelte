<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		ExternalLink,
		RefreshCw,
		Maximize2,
		Minimize2,
		Settings,
		Check,
		ShieldCheck,
		AlertCircle,
		Sparkles,
		Smartphone,
		Info,
		Loader2,
		X
	} from 'lucide-svelte';
	import WhatsAppIcon from '$lib/components/icons/WhatsAppIcon.svelte';
	import { toast } from '$lib/toast.svelte';
	import { getPlatformSettings, updatePlatformSettings, type PlatformSettings } from '$lib/admin/admin-client';

	// Default Workspace URL (can be customized by admin)
	const DEFAULT_KAPSO_URL = 'https://app.kapso.ai';
	const STORAGE_KEY = 'djr_admin_kapso_whatsapp_url';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	let kapsoUrl = $state(DEFAULT_KAPSO_URL);
	let customUrlInput = $state(DEFAULT_KAPSO_URL);
	let iframeLoading = $state(true);
	let isFullscreen = $state(false);
	let showSettingsModal = $state(false);
	let savingUrl = $state(false);
	let iframeRef = $state<HTMLIFrameElement>();
	let loadErrorTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let showLoadWarning = $state(false);
	let platformSettings = $state<PlatformSettings | null>(null);

	const i18n = {
		fr: {
			title: 'Assistance WhatsApp',
			subtitle: 'Console d’assistance WhatsApp intégrée pour la gestion directe des échanges clients.',
			statusActive: 'WhatsApp connecté',
			statusHint: 'Session active',
			reloadBtn: 'Actualiser la fenêtre intégrée',
			newTabBtn: 'Ouvrir l’espace',
			webWhatsappBtn: 'WhatsApp Web',
			fullscreenBtn: 'Plein écran',
			exitFullscreenBtn: 'Quitter plein écran',
			configBtn: 'Configurer l’URL',
			loadingText: 'Chargement de l’espace WhatsApp…',
			warningTitle: 'L’espace WhatsApp met du temps à charger ?',
			warningDesc: 'Certains navigateurs ou paramètres de sécurité de votre compte peuvent restreindre l’affichage intégré.',
			openDirectly: 'Ouvrir l’espace directement',
			configModalTitle: 'Configuration de l’URL WhatsApp',
			configModalDesc: 'Définissez le lien direct vers votre espace de travail ou boîte de réception WhatsApp (sauvegardé sur le serveur).',
			urlLabel: 'URL de votre espace de travail WhatsApp',
			urlPlaceholder: 'https://...',
			resetDefault: 'Rétablir l’URL par défaut',
			saveConfig: 'Enregistrer l’URL',
			configSaved: 'URL WhatsApp enregistrée avec succès dans les paramètres de la plateforme.',
			quickInfoTitle: 'Information d’intégration',
			quickInfoText: 'Cette adresse est enregistrée dans les paramètres généraux. Tous les administrateurs partagent la même URL.',
			cancel: 'Annuler',
			close: 'Fermer'
		},
		ht: {
			title: 'Sipò WhatsApp',
			subtitle: 'Panno asistans WhatsApp pou reponn ak jere mesaj ak kliyan yo dirèkteman.',
			statusActive: 'WhatsApp Konekte',
			statusHint: 'Sesyon aktif',
			reloadBtn: 'Rafrechi iframe',
			newTabBtn: 'Louvri espas la',
			webWhatsappBtn: 'WhatsApp Web',
			fullscreenBtn: 'Ekran konplè',
			exitFullscreenBtn: 'Kite ekran konplè',
			configBtn: 'Konfigire URL',
			loadingText: 'Espas WhatsApp la ap chaje…',
			warningTitle: 'Iframe lan pran tan pou l chaje ?',
			warningDesc: 'Kèk navigatè oswa paramèt sekirite nan kont ou ka anpeche afichaj la nan paj la.',
			openDirectly: 'Louvri espas la dirèkteman',
			configModalTitle: 'Konfigirasyon URL WhatsApp',
			configModalDesc: 'Mete lyen dirèk pou ale nan espas travay oswa bwat mesaj WhatsApp ou a (anrejistre sou sèvè a).',
			urlLabel: 'URL espas travay WhatsApp ou a',
			urlPlaceholder: 'https://...',
			resetDefault: 'Remèt URL pa defo a',
			saveConfig: 'Anrejistre URL la',
			configSaved: 'URL WhatsApp anrejistre avèk siksè nan paramèt jeneral yo.',
			quickInfoTitle: 'Enfòmasyon sou entegrasyon an',
			quickInfoText: 'Adrès sa a anrejistre nan paramèt jeneral yo (Platform Settings). Tout administratè yo pataje menm URL la.',
			cancel: 'Anile',
			close: 'Fèmen'
		}
	};

	let t = $derived(i18n[currentLang]);

	onMount(async () => {
		// First, check localStorage for fast initial render
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved && saved.trim()) {
				kapsoUrl = saved.trim();
				customUrlInput = saved.trim();
			}
		}

		// Then fetch from platform settings backend
		try {
			const settings = await getPlatformSettings();
			platformSettings = settings;
			if (settings.kapsoUrl && settings.kapsoUrl.trim()) {
				const serverUrl = settings.kapsoUrl.trim();
				kapsoUrl = serverUrl;
				customUrlInput = serverUrl;
				if (typeof window !== 'undefined') {
					localStorage.setItem(STORAGE_KEY, serverUrl);
				}
			}
		} catch (err) {
			console.warn('[WhatsApp Admin] Could not load platform settings:', err);
		}

		// Timer to show friendly fallback/warning if iframe loading takes long
		loadErrorTimer = setTimeout(() => {
			if (iframeLoading) {
				showLoadWarning = true;
			}
		}, 6000);
	});

	function handleIframeLoad() {
		iframeLoading = false;
		showLoadWarning = false;
		if (loadErrorTimer) clearTimeout(loadErrorTimer);
	}

	function refreshIframe() {
		iframeLoading = true;
		showLoadWarning = false;
		if (iframeRef) {
			const currentSrc = iframeRef.src;
			iframeRef.src = '';
			setTimeout(() => {
				if (iframeRef) iframeRef.src = currentSrc;
			}, 100);
		}
		if (loadErrorTimer) clearTimeout(loadErrorTimer);
		loadErrorTimer = setTimeout(() => {
			if (iframeLoading) showLoadWarning = true;
		}, 6000);
	}

	async function saveCustomUrl() {
		let formatted = customUrlInput.trim();
		if (!formatted) formatted = DEFAULT_KAPSO_URL;
		if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
			formatted = 'https://' + formatted;
		}

		savingUrl = true;
		kapsoUrl = formatted;
		customUrlInput = formatted;

		// 1. Save in localStorage for fast local fallback
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, formatted);
		}

		// 2. Persist in Appwrite Platform Settings if possible
		try {
			const currentSettings = platformSettings || await getPlatformSettings();
			const updated = await updatePlatformSettings({
				...currentSettings,
				kapsoUrl: formatted
			});
			platformSettings = updated;
			toast.success(t.configSaved);
		} catch (err: any) {
			console.warn('[WhatsApp Admin] Failed to save URL to platform settings:', err);
			toast.success('URL enregistrée localement dans le navigateur.');
		} finally {
			savingUrl = false;
			showSettingsModal = false;
			refreshIframe();
		}
	}

	function resetDefaultUrl() {
		customUrlInput = DEFAULT_KAPSO_URL;
		saveCustomUrl();
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}
</script>

<svelte:head>
	<title>{t.title} · Administration DJR Akademi</title>
</svelte:head>

<div class="space-y-4 {isFullscreen ? 'fixed inset-0 z-50 bg-base-200 p-4 flex flex-col h-screen w-screen space-y-2' : ''}">
	<!-- Top Navigation / Title Banner -->
	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-base-100 border border-base-300 p-4 rounded-2xl shadow-xs">
		<div class="flex items-center gap-3">
			<div class="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
				<WhatsAppIcon size={24} />
			</div>
			<div>
				<div class="flex items-center gap-2.5 flex-wrap">
					<h2 class="text-xl sm:text-2xl font-black tracking-tight text-base-content">{t.title}</h2>
				</div>
				<p class="text-xs text-base-content/65 font-medium mt-0.5">{t.subtitle}</p>
			</div>
		</div>

		<!-- Action Controls Toolbar -->
		<div class="flex items-center gap-2 flex-wrap shrink-0">
			<!-- Config Button -->
			<button
				type="button"
				onclick={() => (showSettingsModal = true)}
				class="btn btn-ghost btn-sm gap-1.5 rounded-xl text-xs font-bold bg-base-200/70 hover:bg-base-200"
				title={t.configBtn}
			>
				<Settings size={15} class="text-base-content/70" />
				<span class="hidden sm:inline">{t.configBtn}</span>
			</button>

			<!-- Open in New Tab -->
			<a
				href={kapsoUrl}
				target="_blank"
				rel="noreferrer"
				class="btn btn-primary btn-sm gap-1.5 rounded-xl text-xs font-bold shadow-xs"
				title={t.newTabBtn}
			>
				<span>{t.newTabBtn}</span>
				<ExternalLink size={14} />
			</a>

			<!-- Fullscreen Toggle -->
			<button
				type="button"
				onclick={toggleFullscreen}
				class="btn btn-square btn-ghost btn-sm rounded-xl bg-base-200/70 hover:bg-base-200"
				title={isFullscreen ? t.exitFullscreenBtn : t.fullscreenBtn}
			>
				{#if isFullscreen}
					<Minimize2 size={16} />
				{:else}
					<Maximize2 size={16} />
				{/if}
			</button>
		</div>
	</div>

	<!-- Main Iframe Container -->
	<div class="relative w-full rounded-2xl border border-base-300 bg-base-100 shadow-sm overflow-hidden flex-1 flex flex-col {isFullscreen ? 'h-full' : 'min-h-[620px] h-[calc(100vh-14rem)]'} transition-all">
		
		<!-- Loading Spinner Overlay -->
		{#if iframeLoading}
			<div class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-base-100/90 backdrop-blur-xs p-6 text-center space-y-3">
				<div class="relative flex items-center justify-center">
					<div class="size-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
					<WhatsAppIcon size={26} class="absolute text-emerald-500" />
				</div>
				<p class="text-sm font-extrabold text-base-content">{t.loadingText}</p>
				<p class="text-xs text-base-content/50 max-w-sm">{kapsoUrl}</p>
			</div>
		{/if}

		<!-- Timeout Warning Notice Banner -->
		{#if showLoadWarning && iframeLoading}
			<div class="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-xl backdrop-blur-md text-amber-950 dark:text-amber-200 flex items-start gap-3">
				<AlertCircle size={20} class="text-amber-500 shrink-0 mt-0.5" />
				<div class="flex-1 text-xs space-y-1">
					<h4 class="font-bold text-sm">{t.warningTitle}</h4>
					<p>{t.warningDesc}</p>
					<div class="pt-2 flex items-center gap-2">
						<a
							href={kapsoUrl}
							target="_blank"
							rel="noreferrer"
							class="btn btn-warning btn-xs font-bold text-black gap-1"
						>
							<span>{t.openDirectly}</span>
							<ExternalLink size={12} />
						</a>
						<button
							type="button"
							onclick={() => (showLoadWarning = false)}
							class="btn btn-ghost btn-xs text-xs font-bold"
						>
							{t.close}
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- The Adapted Iframe -->
		<iframe
			bind:this={iframeRef}
			src={kapsoUrl}
			title="Espace d’assistance WhatsApp"
			onload={handleIframeLoad}
			class="w-full h-full border-0 flex-1 bg-base-100"
			allow="geolocation; microphone; camera; clipboard-read; clipboard-write; autoplay; encrypted-media; fullscreen; display-capture; picture-in-picture"
			sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
			referrerpolicy="no-referrer-when-downgrade"
		></iframe>

		<!-- Footer Bar inside Card -->
		<div class="border-t border-base-200 bg-base-200/40 px-4 py-2 flex items-center justify-between text-[11px] text-base-content/60 flex-wrap gap-2">
			<div class="flex items-center gap-2">
				<ShieldCheck size={14} class="text-emerald-600 dark:text-emerald-400" />
				<span class="font-medium">{t.quickInfoTitle}:</span>
				<span class="font-bold text-base-content/80 truncate max-w-md">{kapsoUrl}</span>
			</div>

			<div class="flex items-center gap-3">
				<span class="badge badge-xs font-mono font-bold badge-ghost">Application Web WhatsApp</span>
				<button
					type="button"
					onclick={() => (showSettingsModal = true)}
					class="hover:underline font-bold text-primary cursor-pointer"
				>
					{t.configBtn}
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Configuration Modal -->
{#if showSettingsModal}
	<div class="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="whatsapp-config-modal-title">
		<div class="modal-box max-w-lg space-y-4 rounded-3xl border border-base-300">
			<button
				class="btn btn-ghost btn-sm btn-circle absolute right-4 top-4"
				type="button"
				aria-label={t.close}
				onclick={() => (showSettingsModal = false)}
			>
				<X size={18} />
			</button>

			<div class="flex items-center gap-3">
				<div class="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
					<Settings size={22} />
				</div>
				<div>
					<h3 id="whatsapp-config-modal-title" class="text-lg font-bold">
						{t.configModalTitle}
					</h3>
					<p class="text-xs text-base-content/60">
						{t.configModalDesc}
					</p>
				</div>
			</div>

			<div class="space-y-3 pt-2">
				<div class="form-control">
					<label class="label text-xs font-bold" for="whatsapp-url-input">
						{t.urlLabel}
					</label>
					<input
						id="whatsapp-url-input"
						type="url"
						class="input input-bordered w-full text-xs font-mono font-semibold"
						placeholder={t.urlPlaceholder}
						bind:value={customUrlInput}
					/>
				</div>

				<div class="rounded-2xl border border-base-300 bg-base-200/50 p-3.5 text-xs text-base-content/75 space-y-1">
					<div class="flex items-center gap-1.5 font-bold text-base-content">
						<Info size={14} class="text-primary" />
						<span>{t.quickInfoTitle}</span>
					</div>
					<p class="leading-relaxed text-[11px]">{t.quickInfoText}</p>
				</div>
			</div>

			<div class="modal-action flex-wrap justify-between items-center gap-2 pt-2">
				<button
					type="button"
					onclick={resetDefaultUrl}
					disabled={savingUrl}
					class="btn btn-ghost btn-xs text-xs font-semibold text-base-content/70 hover:text-base-content"
				>
					{t.resetDefault}
				</button>

				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => (showSettingsModal = false)}
						class="btn btn-ghost btn-sm rounded-xl font-bold text-xs"
					>
						{t.cancel}
					</button>
					<button
						type="button"
						disabled={savingUrl}
						onclick={saveCustomUrl}
						class="btn btn-primary btn-sm rounded-xl font-bold text-xs gap-1.5"
					>
						{#if savingUrl}
							<Loader2 size={15} class="animate-spin" />
						{:else}
							<Check size={15} />
						{/if}
						<span>{t.saveConfig}</span>
					</button>
				</div>
			</div>
		</div>

		<button class="modal-backdrop" type="button" aria-label={t.close} onclick={() => (showSettingsModal = false)}>
			Fermer
		</button>
	</div>
{/if}
