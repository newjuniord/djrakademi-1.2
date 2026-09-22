<script lang="ts">
	import {
		Megaphone,
		X
	} from 'lucide-svelte';
	
	import AuthModal from './AuthModal.svelte';
	import { account } from '$lib/appwrite';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authState } from '$lib/auth.svelte';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	const DEFAULT_SITE_NAME = 'DJR AKADEMI';
	const DEFAULT_LOGO_URL = '/logo.png';

	let drawerOpen = $state(false);
	let authModalOpen = $state(false);
	let authModalInitialView = $state<"login" | "signup">("login");
	let siteName = $state(DEFAULT_SITE_NAME);
	let logoUrl = $state(DEFAULT_LOGO_URL);
	let langDropdownOpen = $state(false);

	let announcement = $state<{
		enabled: boolean;
		text: string;
		textColor: string;
		bgColor: string;
	}>({ enabled: false, text: '', textColor: 'blanc', bgColor: 'noir' });
	let announcementDismissed = $state(false);

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const headerI18n = {
		fr: {
			home: 'Accueil',
			catalogue: 'Catalogue',
			bundles: 'Offres groupées',
			mobileMenu: 'Menu',
			assistance: 'Assistance',
			mySpace: 'Mon espace',
			signup: 'Créer un compte',
			login: 'Connexion',
			closeBanner: 'Fermer la bannière',
			mainMenu: 'Menu principal',
			myAccount: 'Mon compte',
			closeMenu: 'Fermer le menu',
			langLabel: 'Langue / Lang',
			navSection: 'Navigation',
			helpSection: 'Assistance',
			helpLink: 'Aide & Assistance',
			mySpaceSection: 'Mon espace',
			myCourses: 'Mes cours',
			myProfile: 'Mon profil',
			myTransactions: 'Mes transactions',
			adminSection: 'Administration',
			adminManage: 'Gérer la plateforme',
			logout: 'Déconnexion'
		},
		ht: {
			home: 'Akey',
			catalogue: 'Katalòg',
			bundles: 'Pakèt',
			mobileMenu: 'Meni',
			assistance: 'Asistans',
			mySpace: 'Espas mwen',
			signup: 'Enskri',
			login: 'Konekte',
			closeBanner: 'Fèmen bannye an',
			mainMenu: 'Meni prensipal',
			myAccount: 'Kont mwen',
			closeMenu: 'Fèmen meni an',
			langLabel: 'Lang / Langue',
			navSection: 'Navigasyon',
			helpSection: 'Asistans',
			helpLink: 'Èd ak Asistans',
			mySpaceSection: 'Espas mwen',
			myCourses: 'Kou mwen yo',
			myProfile: 'Pwofil mwen',
			myTransactions: 'Transaksyon mwen',
			adminSection: 'Administrasyon',
			adminManage: 'Jere platfòm nan',
			logout: 'Dekonekte'
		}
	};

	let ht = $derived(headerI18n[currentLang]);

	function setLanguage(lang: string) {
		const url = new URL(page.url);
		if (lang === 'ht') {
			url.searchParams.set('lang', 'ht');
		} else {
			url.searchParams.delete('lang');
		}
		goto(url.pathname + url.search + url.hash, { replaceState: true, keepFocus: true, invalidateAll: false });
	}

	function getHref(path: string): string {
		if (currentLang !== 'ht') return path;
		const [pathname, search] = path.split('?');
		const params = new URLSearchParams(search || '');
		params.set('lang', 'ht');
		return `${pathname}?${params.toString()}`;
	}

	function clickOutside(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && langDropdownOpen) {
				langDropdownOpen = false;
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/announcement', { cache: 'no-store' });
			if (res.ok) {
				const data = await res.json();
				const configuredSiteName = typeof data.siteName === 'string' ? data.siteName.trim() : '';
				const configuredLogoUrl = typeof data.logoUrl === 'string' ? data.logoUrl.trim() : '';
				siteName = configuredSiteName || DEFAULT_SITE_NAME;
				logoUrl = configuredLogoUrl || DEFAULT_LOGO_URL;
				if (data.enabled && data.text) {
					announcement = data;
				}
			}
		} catch (e) {
			console.error('Failed to load announcement banner:', e);
		}
	});

	function getBgHex(color: string) {
		switch (color) {
			case 'blanc': return '#ffffff';
			case 'rouge': return '#dc2626';
			case 'jaune': return '#f59e0b';
			case 'verte': return '#16a34a';
			case 'noir': default: return '#000000';
		}
	}

	function getTextHex(color: string) {
		switch (color) {
			case 'noir': return '#000000';
			case 'rouge': return '#ef4444';
			case 'blanc': default: return '#ffffff';
		}
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);

		return {
			destroy() {
				node.remove();
			}
		};
	}

	function closeDrawer() {
		drawerOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDrawer();
			langDropdownOpen = false;
		}
	}

	async function logout() {
		try {
			await account.deleteSession('current');
			authState.user = null;
			authState.isAdmin = false;
		} catch (error) {
			console.error('Logout error:', error);
		}
		closeDrawer();
		goto(getHref('/')); // Redirect to home on logout preserving lang parameter if active
	}

	function login() {
		// Used by modal to trigger view updates if needed
	}

	function openAuth(view: "login" | "signup") {
		authModalInitialView = view;
		authModalOpen = true;
		closeDrawer();
	}

	function toggleHelp() {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('djr:open-support'));
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if announcement.enabled && announcement.text && !announcementDismissed}
	<aside
		class="w-full py-2.5 px-4 text-[16px] font-bold text-center flex items-center justify-between shadow-xs transition-all border-b border-black/10 z-50 relative"
		style={`background-color: ${getBgHex(announcement.bgColor)}; color: ${getTextHex(announcement.textColor)};`}
	>
		<div class="mx-auto flex items-center justify-center gap-2 px-2">
			<Megaphone size={14} class="shrink-0" />
			<span>{announcement.text}</span>
		</div>
		<button
			type="button"
			onclick={() => (announcementDismissed = true)}
			class="p-1 opacity-70 hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
			aria-label={ht.closeBanner}
		>
			<X size={14} />
		</button>
	</aside>
{/if}

<header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
		<!-- Brand Logo Image & Name -->
		<a href={getHref('/')} class="flex min-w-0 items-center gap-3 group">
			<img src={logoUrl} alt={siteName} class="h-10 w-auto shrink-0 object-contain sm:h-11" />
			<span class="hidden truncate font-black text-[22px] tracking-tight text-zinc-950 uppercase transition-colors group-hover:text-amber-500 min-[430px]:inline-block sm:text-[24px]">
				{siteName}
			</span>
		</a>

		<nav class="hidden items-center gap-6 text-[18px] font-bold text-zinc-600 lg:flex" aria-label="Catalogue public">
			<a href={getHref('/')} class="transition-colors hover:text-zinc-950">{ht.home}</a>
			<a href={getHref('/catalogue')} class="transition-colors hover:text-zinc-950">{ht.catalogue}</a>
			<a href={getHref('/bundles')} class="transition-colors hover:text-amber-700">{ht.bundles}</a>
		</nav>

		<!-- Mobile menu button without icon -->
		<button
			type="button"
			onclick={() => (drawerOpen = true)}
			class="inline-flex h-11 shrink-0 items-center rounded-xl border border-zinc-200/80 bg-zinc-950 px-3.5 text-sm font-bold text-amber-400 shadow-sm transition-all active:scale-95 sm:hidden cursor-pointer"
			aria-label={ht.mainMenu}
			aria-expanded={drawerOpen}
		>
			<span>{ht.mobileMenu}</span>
		</button>

		<!-- Desktop actions -->
		<div class="hidden shrink-0 items-center gap-2.5 sm:flex">
			<!-- Custom Language Dropdown -->
			<div class="relative" use:clickOutside>
				<button
					type="button"
					onclick={() => (langDropdownOpen = !langDropdownOpen)}
					class="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-bold text-zinc-800 transition-all hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer active:scale-[0.98]"
					aria-expanded={langDropdownOpen}
					aria-haspopup="true"
					aria-label="Choisir la langue"
				>
					{#if currentLang === 'ht'}
						<span class="text-base leading-none">🇭🇹</span>
						<span>Kreyòl</span>
					{:else}
						<span class="text-base leading-none">🇫🇷</span>
						<span>Français</span>
					{/if}
					<span class="text-[10px] text-zinc-400 font-bold transition-transform duration-200" class:rotate-180={langDropdownOpen}>▼</span>
				</button>

				{#if langDropdownOpen}
					<div
						transition:fly={{ y: 6, duration: 150 }}
						class="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-zinc-200/90 bg-white/98 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
					>
						<button
							type="button"
							onclick={() => { setLanguage('fr'); langDropdownOpen = false; }}
							class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer {currentLang === 'fr' ? 'bg-amber-400/20 text-zinc-950 font-black' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'}"
						>
							<span class="flex items-center gap-2.5">
								<span class="text-base">🇫🇷</span>
								<span>Français</span>
							</span>
							{#if currentLang === 'fr'}
								<span class="text-amber-600 font-black text-xs">✓</span>
							{/if}
						</button>

						<button
							type="button"
							onclick={() => { setLanguage('ht'); langDropdownOpen = false; }}
							class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer {currentLang === 'ht' ? 'bg-amber-400/20 text-zinc-950 font-black' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'}"
						>
							<span class="flex items-center gap-2.5">
								<span class="text-base">🇭🇹</span>
								<span>Kreyòl</span>
							</span>
							{#if currentLang === 'ht'}
								<span class="text-amber-600 font-black text-xs">✓</span>
							{/if}
						</button>
					</div>
				{/if}
			</div>

			{#if authState.loading}
				<div class="h-11 w-32 animate-pulse rounded-xl bg-zinc-100"></div>
			{:else if authState.user !== null}
				<!-- Espas mwen Button (No icon) -->
				<button
					type="button"
					onclick={() => (drawerOpen = true)}
					class="inline-flex h-11 items-center rounded-xl bg-zinc-950 px-5 text-[16px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none sm:px-6 cursor-pointer"
					aria-label={ht.mySpace}
				>
					<span>{ht.mySpace}</span>
				</button>
			{:else}
				<button
					type="button"
					onclick={() => openAuth("login")}
					class="inline-flex h-11 items-center whitespace-nowrap rounded-xl bg-zinc-950 px-4 text-[16px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none sm:px-5 cursor-pointer"
					aria-label={ht.login}
				>
					<span>{ht.login}</span>
				</button>

				<button
					type="button"
					onclick={() => openAuth("signup")}
					class="inline-flex h-11 items-center whitespace-nowrap rounded-xl bg-amber-400 px-4 text-[16px] font-bold text-zinc-950 shadow-sm transition-all hover:bg-amber-300 focus:outline-none sm:px-5 cursor-pointer"
					aria-label={ht.signup}
				>
					<span>{ht.signup}</span>
				</button>
			{/if}
		</div>
	</div>
</header>

<!-- MENI PRINCIPAL / ETIDYAN -->
{#if drawerOpen}
	<div use:portal class="fixed inset-0 z-[9999] pointer-events-none">
	<button
		type="button"
		onclick={closeDrawer}
		class="absolute inset-0 bg-black/40 cursor-default pointer-events-auto"
		aria-label={ht.closeMenu}
		transition:fade={{ duration: 180 }}
	></button>

	<div
		role="dialog"
		aria-modal="true"
		aria-label={ht.mainMenu}
		class="absolute inset-y-0 right-0 z-10 flex w-full max-w-[360px] flex-col overflow-y-auto border-l border-zinc-200 bg-white text-zinc-950 shadow-2xl pointer-events-auto"
		in:fly={{ x: 360, duration: 260, easing: cubicOut }}
		out:fly={{ x: 360, duration: 220, easing: cubicOut }}
	>
		<div class="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-5">
			{#if authState.user !== null}
				<div class="flex min-w-0 items-center gap-3">
					<div class="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800 font-bold text-sm">
						{(authState.user.name || 'K')[0].toUpperCase()}
					</div>
					<div class="min-w-0">
						<p class="truncate text-sm font-bold text-zinc-950">{authState.user.name || ht.myAccount}</p>
						<p class="truncate text-xs text-zinc-500">{authState.user.email || ''}</p>
					</div>
				</div>
			{:else}
				<div class="flex min-w-0 items-center gap-3">
					<img src={logoUrl} alt={siteName} class="size-10 shrink-0 object-contain" />
					<div class="min-w-0">
						<p class="truncate text-sm font-black uppercase text-zinc-950">{siteName}</p>
						<p class="text-xs text-zinc-500">{ht.mainMenu}</p>
					</div>
				</div>
			{/if}

			<button
				type="button"
				onclick={closeDrawer}
				class="grid size-9 shrink-0 place-items-center text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
				aria-label={ht.closeMenu}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Mobile Language Selector Section -->
		<div class="px-5 pt-4 pb-3 border-b border-zinc-100">
			<p class="mb-2 text-xs font-bold text-zinc-500">{ht.langLabel}</p>
			<div class="grid grid-cols-2 gap-2 p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/60">
				<button
					type="button"
					onclick={() => setLanguage('fr')}
					class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer {currentLang === 'fr' ? 'bg-white text-zinc-950 shadow-xs font-black' : 'text-zinc-600 hover:text-zinc-950'}"
				>
					<span>🇫🇷</span>
					<span>Français</span>
				</button>
				<button
					type="button"
					onclick={() => setLanguage('ht')}
					class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer {currentLang === 'ht' ? 'bg-amber-400 text-zinc-950 shadow-xs font-black' : 'text-zinc-600 hover:text-zinc-950'}"
				>
					<span>🇭🇹</span>
					<span>Kreyòl</span>
				</button>
			</div>
		</div>

		<nav class="flex-1 px-4 py-5" aria-label={ht.mainMenu}>
			<div class="sm:hidden">
				<p class="mb-2 px-3 text-xs font-bold text-zinc-500">{ht.navSection}</p>
				<div class="divide-y divide-zinc-100 border-y border-zinc-100">
					<a href={getHref('/')} onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">{ht.home}</a>
					<a href={getHref('/catalogue')} onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">{ht.catalogue}</a>
					<a href={getHref('/bundles')} onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">{ht.bundles}</a>
				</div>
			</div>

			{#if authState.user !== null}
				<div class="mt-6">
					<p class="mb-2 px-3 text-xs font-bold text-zinc-500">{ht.mySpaceSection}</p>
					<div class="divide-y divide-zinc-100 border-y border-zinc-100">
						<a href={getHref('/dashboard')} onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<span>{ht.myCourses}</span>
						</a>
						<a href={getHref('/profile')} onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<span>{ht.myProfile}</span>
						</a>
						<a href={getHref('/transactions')} onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<span>{ht.myTransactions}</span>
						</a>
					</div>
				</div>

				{#if authState.isAdmin}
					<div class="mt-6">
						<p class="mb-2 px-3 text-xs font-bold text-zinc-500">{ht.adminSection}</p>
						<a href={getHref('/admin')} onclick={closeDrawer} class="flex min-h-14 items-center border-y border-zinc-100 px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<span>{ht.adminManage}</span>
						</a>
					</div>
				{/if}
			{/if}
		</nav>

		<div class="border-t border-zinc-200 p-4">
			{#if authState.user !== null}
				<button
					type="button"
					onclick={logout}
					class="flex min-h-12 w-full items-center justify-center border border-red-200 px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 cursor-pointer"
				>
					<span>{ht.logout}</span>
				</button>
			{:else}
				<div class="grid gap-2.5">
					<button
						type="button"
						onclick={() => openAuth("login")}
						class="min-h-12 rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800 cursor-pointer"
					>
						{ht.login}
					</button>
					<button
						type="button"
						onclick={() => openAuth("signup")}
						class="min-h-12 rounded-xl bg-amber-400 px-4 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-300 cursor-pointer"
					>
						{ht.signup}
					</button>
				</div>
			{/if}
		</div>
	</div>
	</div>
{/if}

<AuthModal bind:isOpen={authModalOpen} onLogin={login} initialView={authModalInitialView} />



