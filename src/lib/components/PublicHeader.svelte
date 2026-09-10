<script lang="ts">
	import {
		User,
		Sparkles,
		Shield,
		Menu,
		X,
		Receipt,
		BookOpen,
		ExternalLink,
		LogOut,
		LogIn,
		Megaphone,
		HelpCircle
	} from 'lucide-svelte';
	
	import AuthModal from './AuthModal.svelte';
	import { account } from '$lib/appwrite';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/auth.svelte';
	import { onMount } from 'svelte';

	let drawerOpen = $state(false);
	let authModalOpen = $state(false);

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

	function toggleHelp() {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('djr:open-support'));
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if announcement.enabled && announcement.text && !announcementDismissed}
	<aside
		class="w-full py-2.5 px-4 text-xs font-bold text-center flex items-center justify-between shadow-xs transition-all border-b border-black/10 z-50 relative"
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
		<a href="/" class="flex items-center gap-3 group shrink-0">
			<img src="/logo.png" alt="DJR Akademi" class="h-10 sm:h-11 w-auto object-contain" />
			<span class="hidden min-[430px]:inline-block font-black text-lg sm:text-xl tracking-tight text-zinc-950 uppercase group-hover:text-amber-500 transition-colors">
				DJR AKADEMI
			</span>
		</a>

		<!-- Right Action Button -->
		<div class="flex items-center gap-2.5 shrink-0">
			<!-- Help Icon Button -->
			<button
				type="button"
				onclick={toggleHelp}
				class="size-11 rounded-xl bg-zinc-100 hover:bg-amber-400/20 hover:text-amber-600 text-zinc-600 grid place-items-center transition-all cursor-pointer border border-zinc-200/80 active:scale-95"
				aria-label="Èd ak Asistans"
				title="Èd ak Asistans"
			>
				<HelpCircle size={20} />
			</button>

			{#if authState.loading}
				<div class="h-11 w-32 bg-zinc-100 rounded-xl animate-pulse"></div>
			{:else if authState.user !== null}
				<button
					type="button"
					onclick={() => (drawerOpen = true)}
					class="inline-flex items-center gap-2.5 h-11 px-4 sm:px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm rounded-xl focus:outline-none cursor-pointer"
					aria-label="Ouvri meni espas mwen"
				>
					<Menu size={18} class="text-amber-400" />
					<span class="hidden sm:inline">Espas mwen</span>
				</button>
			{:else}
				<button
					type="button"
					onclick={() => (authModalOpen = true)}
					class="inline-flex items-center gap-2.5 h-11 px-4 sm:px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm rounded-xl focus:outline-none cursor-pointer"
					aria-label="Konekte"
				>
					<LogIn size={18} class="text-amber-400" />
					<span>Koneksyon</span>
				</button>
			{/if}
		</div>
	</div>
</header>

<!-- SLIDE-OVER DRAWER OVERLAY & PANEL -->
{#if drawerOpen}
	<!-- Backdrop Overlay -->
	<button
		type="button"
		onclick={closeDrawer}
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity cursor-default"
		aria-label="Fèmen meni an"
	></button>

	<!-- Drawer Sidebar Panel -->
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Meni espas etidyan"
		class="fixed top-0 bottom-0 right-0 z-50 w-full max-w-sm sm:w-96 bg-zinc-950 text-white shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-zinc-800 animate-in slide-in-from-right duration-300"
	>
		<!-- Drawer Header -->
		<div class="p-6 border-b border-zinc-800 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<div class="size-11 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-sm font-black rounded-xl grid place-items-center shadow shrink-0">
					<User size={20} />
				</div>
				<div class="overflow-hidden">
					<p class="font-black text-sm text-white truncate">{authState.user?.name || 'Kont Mwen'}</p>
					<p class="text-[11px] text-white/50 font-mono truncate">{authState.user?.email || ''}</p>
				</div>
			</div>

			<button
				type="button"
				onclick={closeDrawer}
				class="size-9 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors shrink-0"
				aria-label="Fèmen meni an"
			>
				<X size={18} />
			</button>
		</div>

		<!-- Drawer Main Navigation Links -->
		<div class="p-6 flex-1 space-y-6">
			<div>
				<p class="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Navigasyon Etidyan</p>
				<div class="space-y-1.5">
					<a
						href="/dashboard"
						onclick={closeDrawer}
						class="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/10 transition-colors group"
					>
						<div class="size-9 bg-amber-400/20 text-amber-400 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
							<BookOpen size={18} />
						</div>
						<div>
							<p class="font-black text-xs text-white">Espas Etidyan Mwen</p>
							<p class="text-[11px] text-white/40 font-normal">Fòmasyon, ebook ak coaching</p>
						</div>
					</a>

					<a
						href="/profile"
						onclick={closeDrawer}
						class="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/10 transition-colors group"
					>
						<div class="size-9 bg-white/10 text-white/80 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
							<User size={18} />
						</div>
						<div>
							<p class="font-black text-xs text-white">Profil Mwen</p>
							<p class="text-[11px] text-white/40 font-normal">Enfòmasyon ak mo de pas</p>
						</div>
					</a>

					<a
						href="/catalogue"
						onclick={closeDrawer}
						class="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/10 transition-colors group"
					>
						<div class="size-9 bg-emerald-400/20 text-emerald-400 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
							<Sparkles size={18} />
						</div>
						<div>
							<p class="font-black text-xs text-white">Eksplore katalòg la</p>
							<p class="text-[11px] text-white/40 font-normal">Dekouvri tout pwogram nou yo</p>
						</div>
					</a>

					<a
						href="/transactions"
						onclick={closeDrawer}
						class="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/10 transition-colors group"
					>
						<div class="size-9 bg-blue-400/20 text-blue-400 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
							<Receipt size={18} />
						</div>
						<div>
							<p class="font-black text-xs text-white">Transaksyon Mwen Yo</p>
							<p class="text-[11px] text-white/40 font-normal">Istwa ak fakti PDF</p>
						</div>
					</a>

					<a
						href="/verify"
						onclick={closeDrawer}
						class="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/10 transition-colors group"
					>
						<div class="size-9 bg-amber-400/20 text-amber-400 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
							<Shield size={18} />
						</div>
						<div>
							<p class="font-black text-xs text-white">Verifye yon peman</p>
							<p class="text-[11px] text-white/40 font-normal">Debloke aksè apre achte</p>
						</div>
					</a>
				</div>
			</div>

			{#if authState.isAdmin}
			<div class="pt-4 border-t border-zinc-800">
				<p class="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Administrasyon</p>
				<a
					href="/admin"
					onclick={closeDrawer}
					class="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-white/10 text-white/70 hover:text-white transition-colors group"
				>
					<div class="size-9 bg-white/5 text-white/40 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
						<Shield size={18} />
					</div>
					<div>
						<p class="font-black text-xs">Akse Administrasyon</p>
						<p class="text-[11px] text-white/40 font-normal">Jere kou ak vant</p>
					</div>
				</a>
			</div>
			{/if}
		</div>

		<!-- Drawer Footer -->
		<div class="p-6 border-t border-zinc-800 bg-zinc-900/50 space-y-3">
			<button
				type="button"
				onclick={logout}
				class="w-full flex items-center justify-between p-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors cursor-pointer"
			>
				<span>Dekonekte</span>
				<LogOut size={14} />
			</button>
		</div>
	</div>
{/if}

<AuthModal bind:isOpen={authModalOpen} onLogin={login} />

