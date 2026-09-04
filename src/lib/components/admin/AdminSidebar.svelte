<script lang="ts">
	import { page } from '$app/state';
	import {
		BookOpen,
		CalendarCheck,
		CircleDollarSign,
		FileText,
		LayoutDashboard,
		Settings,
		ShoppingBag,
		Users,
		ShieldCheck,
		Sparkles,
		ChevronRight,
		Activity
	} from 'lucide-svelte';

	type NavItem = {
		label: string;
		href: string;
		icon: typeof LayoutDashboard;
		badge?: { text: string; variant: 'primary' | 'secondary' | 'accent' | 'warning' | 'info' };
	};

	type NavGroup = {
		title: string;
		items: NavItem[];
	};

	let { onNavigate = () => {} }: { onNavigate?: () => void } = $props();

	const navGroups: NavGroup[] = [
		{
			title: 'Vue Principale',
			items: [
				{ label: "Vue d’ensemble", href: '/admin', icon: LayoutDashboard },
				{ label: 'Utilisateurs', href: '/admin/users', icon: Users }
			]
		},
		{
			title: 'Catalogue & Services',
			items: [
				{ label: 'Cours', href: '/admin/courses', icon: BookOpen },
				{ label: 'Ebooks', href: '/admin/ebooks', icon: FileText },
				{ label: 'Coaching', href: '/admin/coaching', icon: CalendarCheck }
			]
		},
		{
			title: 'Finances & Ventes',
			items: [
				{ label: 'Commandes', href: '/admin/orders', icon: ShoppingBag }
			]
		},
		{
			title: 'Système & Monitoring',
			items: [
				{ label: 'Logs Verifikasyon', href: '/admin/verifications', icon: ShieldCheck },
				{ label: 'Santé & Logs API', href: '/admin/health', icon: Activity }
			]
		}
	];

	const settingsItem: NavItem = {
		label: 'Paramètres',
		href: '/admin/settings',
		icon: Settings
	};

	function isActive(href: string) {
		if (href === '/admin') {
			return page.url.pathname === '/admin';
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<aside class="flex h-dvh w-72 flex-col border-r border-base-300 bg-base-100/95 backdrop-blur-xl text-base-content select-none shadow-xl lg:shadow-none">
	<!-- Brand Header -->
	<a
		class="group flex min-h-20 items-center justify-between border-b border-base-200/80 px-6 transition-all hover:bg-base-200/40"
		href="/admin"
		onclick={onNavigate}
	>
		<div class="flex items-center gap-3.5">
			<div class="relative flex items-center justify-center rounded-xl bg-white p-1.5 shadow-md shadow-base-300/50 border border-base-200 transition-transform duration-300 group-hover:scale-105">
				<img src="/logo.png" alt="DJR Akademi Logo" class="h-8 w-auto object-contain" />
				<span class="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-base-100 bg-success"></span>
			</div>
			<div class="flex flex-col leading-none">
				<span class="text-base font-extrabold tracking-tight text-base-content group-hover:text-primary transition-colors">
					DJR Akademi
				</span>
				<div class="flex items-center gap-1.5 mt-1">
					<span class="inline-block size-1.5 rounded-full bg-primary animate-pulse"></span>
					<span class="text-[11px] font-semibold text-base-content/60">Console Admin</span>
				</div>
			</div>
		</div>
		<span class="badge badge-neutral badge-xs font-mono font-bold">v1.2</span>
	</a>

	<!-- Main Navigation -->
	<nav class="flex min-h-0 flex-1 flex-col overflow-y-auto px-3.5 py-5 gap-6 custom-scrollbar" aria-label="Navigation d’administration">
		{#each navGroups as group}
			<div>
				<p class="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-base-content/40">
					{group.title}
				</p>
				<ul class="menu w-full gap-1 p-0">
					{#each group.items as item}
						{@const active = isActive(item.href)}
						<li>
							<a
								href={item.href}
								onclick={onNavigate}
								class="group/link flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 {active ? 'bg-primary text-primary-content shadow-md shadow-primary/25 font-semibold' : 'hover:bg-base-200/70 hover:text-base-content text-base-content/75'}"
								aria-current={active ? 'page' : undefined}
							>
								<div class="flex items-center gap-3">
									<item.icon
										size={19}
										strokeWidth={active ? 2.2 : 1.8}
										class="transition-transform duration-200 group-hover/link:scale-110 {active ? 'text-primary-content' : 'text-base-content/60 group-hover/link:text-primary'}"
									/>
									<span>{item.label}</span>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</nav>

	<!-- Footer Section with Settings & Admin Profile -->
	<div class="border-t border-base-200/80 p-3.5 gap-2 flex flex-col">
		<!-- Settings Item -->
		<ul class="menu w-full p-0">
			{#each [settingsItem] as item}
				{@const active = isActive(item.href)}
				<li>
					<a
						href={item.href}
						onclick={onNavigate}
						class="flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 {active ? 'bg-primary text-primary-content shadow-md shadow-primary/25 font-semibold' : 'hover:bg-base-200/70 hover:text-base-content text-base-content/75'}"
						aria-current={active ? 'page' : undefined}
					>
						<div class="flex items-center gap-3">
							<item.icon
								size={19}
								strokeWidth={active ? 2.2 : 1.8}
								class={active ? 'text-primary-content' : 'text-base-content/60'}
							/>
							<span>{item.label}</span>
						</div>
						<ChevronRight size={15} class="opacity-40" />
					</a>
				</li>
			{/each}
		</ul>

		<!-- Mini Support / Status Box -->
		<div class="rounded-xl bg-base-200/60 p-3 border border-base-300/50 flex items-center justify-between text-xs">
			<div class="flex items-center gap-2 font-medium">
				<span class="relative flex size-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
					<span class="relative inline-flex size-2 rounded-full bg-success"></span>
				</span>
				<span class="text-base-content/80 font-semibold">Système Actif</span>
			</div>
			<a
				href="mailto:support@djrakademi.com"
				class="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
			>
				Support
			</a>
		</div>
	</div>
</aside>


