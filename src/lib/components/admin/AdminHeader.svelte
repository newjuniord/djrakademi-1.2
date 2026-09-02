<script lang="ts">
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

	const pageTitles: Record<string, string> = {
		users: 'Utilisateurs',
		utilisateurs: 'Utilisateurs',
		courses: 'Cours',
		cours: 'Cours',
		ebooks: 'Ebooks',
		coaching: 'Coaching',
		orders: 'Commandes',
		commandes: 'Commandes',
		settings: 'Paramètres',
		parametres: 'Paramètres'
	};

	let section = $derived(page.url.pathname.split('/')[2] ?? '');
	let title = $derived(section ? (pageTitles[section] ?? 'Administration') : 'Vue d’ensemble');
	let description = $derived(
		section ? `Gérez et supervisez la section ${title.toLowerCase()}.` : 'Aperçu global des performances et de l’activité en temps réel.'
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
			window.location.href = '/';
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
				aria-label="Ouvrir le menu"
				onclick={onMenuClick}
			>
				<Menu size={20} />
			</button>
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold text-base-content/40 hidden sm:inline">Admin</span>
					<span class="text-xs text-base-content/30 hidden sm:inline">/</span>
					<h1 class="truncate text-lg font-bold tracking-tight sm:text-xl text-base-content">{title}</h1>
				</div>
				<p class="hidden truncate text-xs text-base-content/60 sm:block mt-0.5">{description}</p>
			</div>
		</div>

		<!-- Right Side: Search, Public Site & User Profile Dropdown -->
		<div class="flex shrink-0 items-center gap-2 sm:gap-3">


			<!-- Public Site Button -->
			<a
				class="btn btn-ghost bg-base-200/70 hover:bg-base-200 border-none btn-sm hidden sm:inline-flex min-h-9 gap-1.5 rounded-xl font-semibold text-xs text-base-content transition-all"
				href="/"
				target="_blank"
				rel="noreferrer"
			>
				<span>Voir le site</span>
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
						<span class="block text-[10px] font-medium text-base-content/55">Super Admin</span>
					</div>
					<ChevronDown class="hidden md:block opacity-60" size={14} />
				</summary>
				<ul class="dropdown-content menu z-50 mt-2 w-60 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl text-xs gap-0.5">
					<li class="px-3 py-2 border-b border-base-200 mb-1 pointer-events-none">
						<span class="font-bold text-base-content text-xs block">{adminName}</span>
						<span class="text-[11px] text-base-content/60 font-medium block truncate">{adminEmail}</span>
					</li>
					<li>
						<a href="/profile" class="flex items-center gap-2.5 py-2.5 px-3 rounded-xl font-semibold hover:bg-base-200 transition-colors">
							<UserRound size={15} class="text-base-content/60" /> Mon profil
						</a>
					</li>
					<li>
						<a href="/admin/settings" class="flex items-center gap-2.5 py-2.5 px-3 rounded-xl font-semibold hover:bg-base-200 transition-colors">
							<Settings size={15} class="text-base-content/60" /> Paramètres généraux
						</a>
					</li>
					<li class="my-1 border-t border-base-200" role="separator"></li>
					<li>
						<button
							type="button"
							class="flex w-full items-center gap-2.5 py-2.5 px-3 rounded-xl font-semibold text-error hover:bg-error/10 transition-colors text-left"
							onclick={handleLogout}
						>
							<LogOut size={15} /> Déconnexion
						</button>
					</li>
				</ul>
			</details>
		</div>
	</div>
</header>

