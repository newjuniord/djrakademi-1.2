<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { RecentOrder } from '$lib/types/admin';

	let { orders }: { orders: RecentOrder[] } = $props();

	function typeBadge(type: RecentOrder['type']) {
		if (type === 'Cours') return 'badge-primary';
		if (type === 'Ebook') return 'badge-neutral';
		return 'badge-outline';
	}

	function statusBadge(status: RecentOrder['status']) {
		if (status === 'Payé') return 'bg-success/15 text-success';
		if (status === 'En attente') return 'bg-warning/15 text-warning';
		if (status === 'Échoué') return 'bg-error/15 text-error';
		return 'bg-base-300/80 text-base-content/60';
	}
</script>

<section class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden min-w-0">
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-base-200/70 px-6 py-4">
		<h2 class="text-base font-semibold">Commandes récentes</h2>
		<a class="link link-primary inline-flex items-center gap-1 text-sm font-semibold no-underline hover:underline" href="/admin/orders">
			Voir toutes les commandes <ArrowRight size={15} />
		</a>
	</div>
	<div class="overflow-x-auto">
		<table class="table w-full rounded-none">
			<thead class="bg-base-200/70 text-xs font-bold text-base-content/60 uppercase tracking-wider border-b border-base-200">
				<tr>
					<th class="py-4 pl-6">Client</th><th>Produit</th><th>Type</th><th>Montant</th><th>Statut</th><th class="pr-6">Date</th>
				</tr>
			</thead>
			<tbody class="text-sm">
				{#each orders as order}
					<tr class="odd:bg-base-200/40 even:bg-base-100 hover:bg-base-200/70 transition-colors border-b border-base-200/50">
						<td class="whitespace-nowrap font-semibold py-4 pl-6">{order.client}</td>
						<td class="min-w-40 py-4">{order.product}</td>
						<td class="py-4"><span class={`badge badge-sm border-none font-semibold ${typeBadge(order.type)}`}>{order.type}</span></td>
						<td class="whitespace-nowrap font-medium py-4">{order.amount}</td>
						<td class="py-4"><span class={`badge badge-sm font-semibold border-none px-2.5 py-2 ${statusBadge(order.status)}`}>{order.status}</span></td>
						<td class="whitespace-nowrap text-base-content/60 py-4 pr-6">{order.date}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
