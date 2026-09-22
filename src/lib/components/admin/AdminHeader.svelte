<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		ChevronDown,
		ExternalLink,
		LogOut,
		Menu,
		Search,
		Settings,
		UserRound
	} from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { account } from '$lib/appwrite';

	let { onMenuClick }: { onMenuClick: () => void } = $props();

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');
	let langDropdownOpen = $state(false);

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

	const pageTitles: Record<string, { fr: string; ht: string }> = {
		users: { fr: 'Utilisateurs', ht: 'Itilizatè yo' },
		utilisateurs: { fr: 'Utilisateurs', ht: 'Itilizatè yo' },
		courses: { fr: 'Cours', ht: 'Kou yo' },
		cours: { fr: 'Cours', ht: 'Kou yo' },
		ebooks: { fr: 'Livres numériques', ht: 'E-books PDF' },
		bundles: { fr: 'Offres groupées', ht: 'Pakèt resous' },
		coaching: { fr: 'Coaching', ht: 'Sesyon Coaching' },
		orders: { fr: 'Commandes', ht: 'Kòmand yo' },
		commandes: { fr: 'Commandes', ht: 'Kòmand yo' },
		support: { fr: 'Assistance client', ht: 'Sipò Kliyan' },
		verifications: { fr: 'Journaux de vérification', ht: 'Jounal verifikasyon' },
		health: { fr: 'Santé et journaux API', ht: 'Santé ak Jounal API' },
		settings: { fr: 'Paramètres', ht: 'Paramèt jeneral' },
		parametres: { fr: 'Paramètres', ht: 'Paramèt jeneral' }
	};

	const i18n = {
		fr: {
			adminLabel: 'Admin',
			defaultTitle: 'Administration',
			overviewTitle: 'Vue d’ensemble',
			sectionDesc: (name: string) => `Gérez et supervisez la section ${name.toLowerCase()}.`,
			overviewDesc: 'Aperçu global des performances et de l’activité en temps réel.',
			viewSite: 'Voir le site',
			myProfile: 'Mon profil',
			generalSettings: 'Paramètres généraux',
			logout: 'Déconnexion',
			superAdmin: 'Super Admin',
			openMenu: 'Ouvrir le menu'
		},
		ht: {
			adminLabel: 'Admin',
			defaultTitle: 'Administrasyon',
			overviewTitle: 'Vipriz anblòk',
			sectionDesc: (name: string) => `Jere ak kontwole seksyon ${name.toLowerCase()} an.`,
			overviewDesc: 'Apèsi jeneral sou pèfòmans ak aktivite sou platfòm nan.',
			viewSite: 'Gade sit la',
			myProfile: 'Pwofil mwen',
			generalSettings: 'Paramèt jeneral',
			logout: 'Dekonekte',
			superAdmin: 'Sipè Admin',
			openMenu: 'Louvri meni an'
		}
	};

	let t = $derived(i18n[currentLang]);

	let section = $derived(page.url.pathname.split('/')[2] ?? '');
	let title = $derived(section ? (pageTitles[section]?.[currentLang] ?? t.defaultTitle) : t.overviewTitle);
	let description = $derived(
		section ? t.sectionDesc(title) : t.overviewDesc
	);

	let adminName = $derived(authState.profile?.name || authState.user?.name || 'Admin DJR');
	let adminEmail = $derived(authState.user?.email || 'admin@djrakademi.com');
	let initials = $derived(adminName.slice(0, 2).toUpperCase() || 'AD');

	async function handleLogout() {
		try {
			await account.deleteSession('current');
		} catch (err) {
			console.warn('[AdminHeader] Logout session error:', err);
		} finally {
			authState.user = null;
			authState.profile = null;
			window.location.href = getHref('/');
		}
	}
</script>

<header class="sticky top-0 z-40 border-b border-base-200/80 bg-base-100/90 backdrop-blur-md transition-all">
	<div class="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
		<!-- Left Side: Mobile Menu & Page Title / Breadcrumb -->
		<div class="flex min-w-0 items-center gap-3.5">
			<button
				class="btn btn-square btn-ghost btn-sm lg:hidden hover:bg-base-200"
				type="button"
				aria-label={t.openMenu}
				onclick={onMenuClick}
			>
				<Menu size={20} />
			</button>
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold text-base-content/40 hidden sm:inline">{t.adminLabel}</span>
					<span class="text-xs text-base-content/30 hidden sm:inline">/</span>
					<h1 class="truncate text-lg font-bold tracking-tight sm:text-xl text-base-content">{title}</h1>
				</div>
				<p class="hidden truncate text-xs text-base-content/60 sm:block mt-0.5">{description}</p>
			</div>
		</div>

		<!-- Right Side: Language Switcher, Public Site & User Profile Dropdown -->
		<div class="flex shrink-0 items-center gap-2 sm:gap-3">

			<!-- Language Switcher -->
			<div class="relative" use:clickOutside>
				<button
					type="button"
					onclick={() => (langDropdownOpen = !langDropdownOpen)}
					class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-base-300 bg-base-200/60 px-3 text-xs font-bold text-base-content transition-all hover:bg-base-200 cursor-pointer"
					aria-expanded={langDropdownOpen}
					aria-label="Choisir la langue / Chwazi lang"
				>
					{#if currentLang === 'ht'}
						<span>🇭🇹</span>
						<span>Kreyòl</span>
					{:else}
						<span>🇫🇷</span>
						<span>Français</span>
					{/if}
					<ChevronDown size={12} class="opacity-60 transition-transform duration-200" class:rotate-180={langDropdownOpen} />
				</button>

				{#if langDropdownOpen}
					<div class="absolute right-0 top-full mt-2 w-40 rounded-2xl border border-base-300 bg-base-100 p-1.5 shadow-xl z-50 overflow-hidden">
						<button
							type="button"
							onclick={() => { setLanguage('fr'); langDropdownOpen = false; }}
							class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer {currentLang === 'fr' ? 'bg-primary/15 text-primary font-black' : 'text-base-content/70 hover:bg-base-200'}"
						>
							<span class="flex items-center gap-2">
								<span>🇫🇷</span>
								<span>Français</span>
							</span>
							{#if currentLang === 'fr'}<span>✓</span>{/if}
						</button>

						<button
							type="button"
							onclick={() => { setLanguage('ht'); langDropdownOpen = false; }}
							class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer {currentLang === 'ht' ? 'bg-amber-400/20 text-zinc-950 font-black' : 'text-base-content/70 hover:bg-base-200'}"
						>
							<span class="flex items-center gap-2">
								<span>🇭🇹</span>
								<span>Kreyòl</span>
							</span>
							{#if currentLang === 'ht'}<span>✓</span>{/if}
						</button>
					</div>
				{/if}
			</div>

			<!-- Public Site Button -->
			<a
				class="btn btn-ghost bg-base-200/70 hover:bg-base-200 border-none btn-sm hidden sm:inline-flex min-h-9 gap-1.5 rounded-xl font-semibold text-xs text-base-content transition-all"
				href={getHref('/')}
				target="_blank"
				rel="noreferrer"
			>
				<span>{t.viewSite}</span>
				<ExternalLink size={14} />
			</a>

			<div class="h-5 w-px bg-base-300 mx-0.5 hidden sm:block"></div>

			<!-- User Profile Dropdown -->
			<details class="dropdown dropdown-end">
				<summary class="btn btn-ghost h-auto min-h-10 list-none gap-2 px-1.5 sm:px-2.5 rounded-xl hover:bg-base-200 cursor-pointer" aria-label="Menu administrateur">
					<div class="avatar placeholder online">
						<div class="w-8 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-content font-bold ring-2 ring-primary/20 flex items-center justify-center text-xs">
							<span>{initials}</span>
						</div>
					</div>
					<div class="hidden text-left sm:block">
						<span class="block text-xs font-bold leading-tight text-base-content">{adminName}</span>
						<span class="block text-[10px] font-medium text-base-content/55">{t.superAdmin}</span>
					</div>
					<ChevronDown class="hidden md:block opacity-60" size={14} />
				</summary>
				<ul class="dropdown-content menu z-50 mt-2 w-60 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl text-xs gap-0.5">
					<li class="px-3 py-2 border-b border-base-200 mb-1 pointer-events-none">
						<span class="font-bold text-base-content text-xs block">{adminName}</span>
						<span class="text-[11px] text-base-content/60 font-medium block truncate">{adminEmail}</span>
					</li>
					<li>
						<a href={getHref('/profile')} class="flex items-center gap-2.5 py-2.5 px-3 rounded-xl font-semibold hover:bg-base-200 transition-colors">
							<UserRound size={15} class="text-base-content/60" /> {t.myProfile}
						</a>
					</li>
					<li>
						<a href={getHref('/admin/settings')} class="flex items-center gap-2.5 py-2.5 px-3 rounded-xl font-semibold hover:bg-base-200 transition-colors">
							<Settings size={15} class="text-base-content/60" /> {t.generalSettings}
						</a>
					</li>
					<li class="my-1 border-t border-base-200" role="separator"></li>
					<li>
						<button
							type="button"
							class="flex w-full items-center gap-2.5 py-2.5 px-3 rounded-xl font-semibold text-error hover:bg-error/10 transition-colors text-left"
							onclick={handleLogout}
						>
							<LogOut size={15} /> {t.logout}
						</button>
					</li>
				</ul>
			</details>
		</div>
	</div>
</header>
