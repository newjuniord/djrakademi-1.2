<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Loader2, AlertCircle } from 'lucide-svelte';
	import RecentOrders from '$lib/components/admin/RecentOrders.svelte';
	import RecentUsers from '$lib/components/admin/RecentUsers.svelte';
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import UpcomingBookings from '$lib/components/admin/UpcomingBookings.svelte';
	import { getAdminOverview } from '$lib/admin/admin-client';
	import type { AdminStat, RecentOrder, RecentUser, UpcomingBooking } from '$lib/types/admin';

	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let stats = $state<AdminStat[]>([]);
	let ordersList = $state<RecentOrder[]>([]);
	let usersList = $state<RecentUser[]>([]);
	let bookingsList = $state<UpcomingBooking[]>([]);
	let totalRevenue = $state(0);
	const quickActions = [
		{ label: 'Ajouter un cours', href: '/admin/courses/new' },
		{ label: 'Ajouter un ebook', href: '/admin/ebooks/new' },
		{ label: 'Ajouter un coaching', href: '/admin/coaching/new' },
		{ label: 'Gérer les utilisateurs', href: '/admin/users' }
	];

	async function loadOverview() {
		loading = true;
		loadError = null;
		try {
			const overview = await getAdminOverview();
			totalRevenue = overview.revenue;

			stats = [
				{
					label: "Chiffre d'affaires",
					value: `${totalRevenue.toLocaleString('fr-FR')} HTG`,
					detail: `${overview.paidOrders} ventes validées`,
					icon: 'revenue'
				},
				{
					label: 'Ventes',
					value: `${overview.paidOrders}`,
					detail: 'Commandes payées',
					icon: 'sales'
				},
				{
					label: 'Utilisateurs',
					value: `${overview.totalUsers}`,
					detail: overview.disabledUsers > 0
						? `${overview.disabledUsers} bloqué${overview.disabledUsers > 1 ? 's' : ''} (${overview.totalUsers - overview.disabledUsers} actif${overview.totalUsers - overview.disabledUsers > 1 ? 's' : ''})`
						: `${overview.totalUsers} apprenants actifs (0 bloqué)`,
					icon: 'users'
				},
				{
					label: 'Réservations',
					value: `${overview.totalBookings}`,
					detail: 'Sessions coaching',
					icon: 'bookings'
				}
			];

			ordersList = overview.recentOrders.map((o) => ({
				id: o.id,
				client: o.customerName,
				product: o.productTitle,
				type: (o.type === 'course' ? 'Cours' : o.type === 'ebook' ? 'Ebook' : 'Coaching') as 'Cours' | 'Ebook' | 'Coaching',
				amount: `${o.amount.toLocaleString('fr-FR')} HTG`,
				status: o.status === 'paid' ? 'Payé' : o.status === 'pending' ? 'En attente' : o.status === 'failed' ? 'Échoué' : 'Expiré',
				date: new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
			}));

			usersList = overview.recentUsers.map((p) => ({
				id: p.id,
				name: p.name || 'Utilisateur',
				email: p.email,
				joinedAt: new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
				initials: (p.name || 'US').substring(0, 2).toUpperCase()
			}));

			bookingsList = overview.upcomingBookings.map((b) => ({
				id: b.id,
				client: b.customerName,
				coaching: b.serviceTitle,
				date: new Date(b.startAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
				time: new Date(b.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
			}));
		} catch (e) {
			console.warn("[AdminOverview] Failed to load statistics:", e);
			loadError = e instanceof Error ? e.message : "Impossible de charger le tableau de bord.";
		} finally {
			loading = false;
		}
	}

	onMount(loadOverview);
</script>

<svelte:head>
	<title>Vue d’ensemble · DJR Akademi</title>
	<meta name="description" content="Vue d’ensemble de l’administration DJR Akademi" />
</svelte:head>

<div class="space-y-10 p-1">
	{#if loadError}
		<div class="alert alert-error rounded-none"><AlertCircle size={18} /><span>{loadError}</span><button type="button" class="btn btn-sm" onclick={loadOverview}>Réessayer</button></div>
	{:else if loading}
		<div class="card bg-base-100 p-12 text-center text-base-content/50 space-y-3">
			<Loader2 size={36} class="mx-auto animate-spin text-primary" />
			<p class="text-xs font-semibold">Chargement du tableau de bord...</p>
		</div>
	{:else}
		<section aria-labelledby="stats-title">
			<h2 id="stats-title" class="sr-only">Statistiques principales</h2>
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
				{#each stats as stat}
					<StatCard {stat} />
				{/each}
			</div>
		</section>

		<RecentOrders orders={ordersList} />

		<div class="grid gap-10 xl:grid-cols-2">
			<UpcomingBookings bookings={bookingsList} />
			<RecentUsers users={usersList} />
		</div>
	{/if}

	<section class="card bg-base-100 shadow-sm border-none rounded-none" aria-labelledby="actions-title">
		<div class="card-body p-5 sm:p-6">
			<h2 id="actions-title" class="text-base font-semibold">Actions rapides</h2>
			<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{#each quickActions as action}
					<a class="btn btn-ghost bg-base-200/60 hover:bg-base-200 border-none min-h-11 justify-start rounded-none text-xs font-semibold" href={action.href}>
						<Plus size={17} /> {action.label}
					</a>
				{/each}
			</div>
		</div>
	</section>
</div>
