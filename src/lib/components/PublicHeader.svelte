<script lang="ts">
	import {
		User,
		Shield,
		Menu,
		X,
		Receipt,
		BookOpen,
		LogOut,
		Megaphone,
		HelpCircle
	} from 'lucide-svelte';
	
	import AuthModal from './AuthModal.svelte';
	import { account } from '$lib/appwrite';
	import { goto } from '$app/navigation';
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

	let announcement = $state<{
		enabled: boolean;
		text: string;
		textColor: string;
		bgColor: string;
	}>({ enabled: false, text: '', textColor: 'blanc', bgColor: 'noir' });
	let announcementDismissed = $state(false);

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
		goto('/'); // Redirect to home on logout
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
			aria-label="Fèmen bannye an"
		>
			<X size={14} />
		</button>
	</aside>
{/if}

<header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
		<!-- Brand Logo Image & Name -->
		<a href="/" class="flex min-w-0 items-center gap-3 group">
			<img src={logoUrl} alt={siteName} class="h-10 w-auto shrink-0 object-contain sm:h-11" />
			<span class="hidden truncate font-black text-[22px] tracking-tight text-zinc-950 uppercase transition-colors group-hover:text-amber-500 min-[430px]:inline-block sm:text-[24px]">
				{siteName}
			</span>
		</a>

		<nav class="hidden items-center gap-6 text-[18px] font-bold text-zinc-600 lg:flex" aria-label="Catalogue public">
			<a href="/" class="transition-colors hover:text-zinc-950">Akey</a>
			<a href="/catalogue" class="transition-colors hover:text-zinc-950">Katalòg</a>
			<a href="/bundles" class="transition-colors hover:text-amber-700">Bundles</a>
		</nav>

		<!-- Mobile hamburger -->
		<button
			type="button"
			onclick={() => (drawerOpen = true)}
			class="grid size-11 shrink-0 place-items-center rounded-xl border border-zinc-200/80 bg-zinc-950 text-white shadow-sm transition-all active:scale-95 sm:hidden"
			aria-label="Ouvri meni prensipal la"
			aria-expanded={drawerOpen}
		>
			<Menu size={21} class="text-amber-400" />
		</button>

		<!-- Desktop actions -->
		<div class="hidden shrink-0 items-center gap-2.5 sm:flex">
			<button
				type="button"
				onclick={toggleHelp}
				class="grid size-11 place-items-center rounded-xl border border-zinc-200/80 bg-zinc-100 text-zinc-600 transition-all hover:bg-amber-400/20 hover:text-amber-600 active:scale-95 cursor-pointer"
				aria-label="Èd ak Asistans"
				title="Èd ak Asistans"
			>
				<HelpCircle size={20} />
			</button>

			{#if authState.loading}
				<div class="h-11 w-32 animate-pulse rounded-xl bg-zinc-100"></div>
			{:else if authState.user !== null}
				<button
					type="button"
					onclick={() => (drawerOpen = true)}
					class="inline-flex h-11 items-center gap-2.5 rounded-xl bg-zinc-950 px-4 text-[16px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none sm:px-5 cursor-pointer"
					aria-label="Ouvri meni espas mwen"
				>
					<Menu size={18} class="text-amber-400" />
					<span>Espas mwen</span>
				</button>
			{:else}
				<button
					type="button"
					onclick={() => openAuth("signup")}
					class="inline-flex h-11 items-center whitespace-nowrap rounded-xl bg-amber-400 px-3 text-[16px] font-bold text-zinc-950 shadow-sm transition-all hover:bg-amber-300 focus:outline-none sm:px-4 cursor-pointer"
					aria-label="Kreye yon kont"
				>
					<span>Kreye yon kont</span>
				</button>

				<button
					type="button"
					onclick={() => openAuth("login")}
					class="inline-flex h-11 items-center whitespace-nowrap rounded-xl bg-zinc-950 px-3 text-[16px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none sm:px-4 cursor-pointer"
					aria-label="Konekte"
				>
					<span>Koneksyon</span>
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
		aria-label="Fèmen meni an"
		transition:fade={{ duration: 180 }}
	></button>

	<div
		role="dialog"
		aria-modal="true"
		aria-label="Meni prensipal"
		class="absolute inset-y-0 right-0 z-10 flex w-full max-w-[360px] flex-col overflow-y-auto border-l border-zinc-200 bg-white text-zinc-950 shadow-2xl pointer-events-auto"
		in:fly={{ x: 360, duration: 260, easing: cubicOut }}
		out:fly={{ x: 360, duration: 220, easing: cubicOut }}
	>
		<div class="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-5">
			{#if authState.user !== null}
				<div class="flex min-w-0 items-center gap-3">
					<div class="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800">
						<User size={19} />
					</div>
					<div class="min-w-0">
						<p class="truncate text-sm font-bold text-zinc-950">{authState.user.name || 'Kont mwen'}</p>
						<p class="truncate text-xs text-zinc-500">{authState.user.email || ''}</p>
					</div>
				</div>
			{:else}
				<div class="flex min-w-0 items-center gap-3">
					<img src={logoUrl} alt={siteName} class="size-10 shrink-0 object-contain" />
					<div class="min-w-0">
						<p class="truncate text-sm font-black uppercase text-zinc-950">{siteName}</p>
						<p class="text-xs text-zinc-500">Meni prensipal</p>
					</div>
				</div>
			{/if}

			<button
				type="button"
				onclick={closeDrawer}
				class="grid size-9 shrink-0 place-items-center text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
				aria-label="Fèmen meni an"
			>
				<X size={20} />
			</button>
		</div>

		<nav class="flex-1 px-4 py-5" aria-label="Navigasyon prensipal">
			<div class="sm:hidden">
				<p class="mb-2 px-3 text-xs font-bold text-zinc-500">Navigasyon</p>
				<div class="divide-y divide-zinc-100 border-y border-zinc-100">
					<a href="/" onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">Akey</a>
					<a href="/catalogue" onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">Katalòg</a>
					<a href="/bundles" onclick={closeDrawer} class="flex min-h-14 items-center px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">Bundles</a>
				</div>
			</div>

			<div class="mt-6">
				<p class="mb-2 px-3 text-xs font-bold text-zinc-500">Asistans</p>
				<button
					type="button"
					onclick={() => { closeDrawer(); toggleHelp(); }}
					class="flex min-h-14 w-full items-center gap-3 border-y border-zinc-100 px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-zinc-50 cursor-pointer"
				>
					<HelpCircle size={19} class="shrink-0 text-amber-700" />
					<span>Èd ak Asistans</span>
				</button>
			</div>

			{#if authState.user !== null}
				<div class="mt-6">
					<p class="mb-2 px-3 text-xs font-bold text-zinc-500">Espas mwen</p>
					<div class="divide-y divide-zinc-100 border-y border-zinc-100">
						<a href="/dashboard" onclick={closeDrawer} class="flex min-h-14 items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<BookOpen size={19} class="shrink-0 text-amber-700" />
							<span>Kou mwen yo</span>
						</a>
						<a href="/profile" onclick={closeDrawer} class="flex min-h-14 items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<User size={19} class="shrink-0 text-zinc-500" />
							<span>Pwofil mwen</span>
						</a>
						<a href="/transactions" onclick={closeDrawer} class="flex min-h-14 items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<Receipt size={19} class="shrink-0 text-zinc-500" />
							<span>Transaksyon mwen</span>
						</a>
					</div>
				</div>

				{#if authState.isAdmin}
					<div class="mt-6">
						<p class="mb-2 px-3 text-xs font-bold text-zinc-500">Administrasyon</p>
						<a href="/admin" onclick={closeDrawer} class="flex min-h-14 items-center gap-3 border-y border-zinc-100 px-3 py-3 text-sm font-semibold transition-colors hover:bg-zinc-50">
							<Shield size={19} class="shrink-0 text-zinc-500" />
							<span>Jere platfòm nan</span>
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
					class="flex min-h-12 w-full items-center justify-between border border-red-200 px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 cursor-pointer"
				>
					<span>Dekonekte</span>
					<LogOut size={17} />
				</button>
			{:else}
				<div class="grid gap-2.5">
					<button
						type="button"
						onclick={() => openAuth("signup")}
						class="min-h-12 rounded-xl bg-amber-400 px-4 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-300 cursor-pointer"
					>
						Kreye yon kont
					</button>
					<button
						type="button"
						onclick={() => openAuth("login")}
						class="min-h-12 rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800 cursor-pointer"
					>
						Koneksyon
					</button>
				</div>
			{/if}
		</div>
	</div>
	</div>
{/if}

<AuthModal bind:isOpen={authModalOpen} onLogin={login} initialView={authModalInitialView} />
