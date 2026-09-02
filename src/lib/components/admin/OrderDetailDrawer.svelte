<script lang="ts">
	import type { Order } from '$lib/types/admin';
	import {
		X,
		ShoppingBag,
		User,
		Mail,
		Phone,
		BookOpen,
		FileText,
		CalendarCheck,
		CreditCard,
		CheckCircle2,
		Clock,
		XCircle,
		AlertTriangle
	} from 'lucide-svelte';

	let {
		open = false,
		order = null,
		onClose
	}: {
		open: boolean;
		order: Order | null;
		onClose: () => void;
	} = $props();

	function formatDateWithTime(dateString?: string): string {
		if (!dateString) return '—';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return dateString;
		return new Intl.DateTimeFormat('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
</script>

{#if open && order}
	<!-- Backdrop Overlay -->
	<button
		type="button"
		class="fixed inset-0 bg-black/50 z-40 transition-opacity"
		onclick={onClose}
		aria-label="Fermer les détails"
	></button>

	<!-- Right Slide Drawer -->
	<div
		class="fixed right-0 top-0 bottom-0 h-full w-full max-w-lg bg-base-100 shadow-2xl flex flex-col z-50 overflow-hidden border-l border-base-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="order-drawer-title"
	>
		<!-- Header Sticky Bar -->
		<div class="p-6 border-b border-base-200 flex items-center justify-between shrink-0 bg-base-100">
			<div>
				<div class="flex items-center gap-2">
					<h2 id="order-drawer-title" class="text-xl font-bold text-base-content">
						{order.reference}
					</h2>
					{#if order.status === 'paid'}
						<span class="badge badge-success badge-sm font-semibold text-[10px] bg-success/15 text-success border-none">
							Payé
						</span>
					{:else if order.status === 'pending'}
						<span class="badge badge-warning badge-sm font-semibold text-[10px] bg-warning/15 text-warning border-none">
							En attente
						</span>
					{:else if order.status === 'failed'}
						<span class="badge badge-error badge-sm font-semibold text-[10px] bg-error/15 text-error border-none">
							Échoué
						</span>
					{:else}
						<span class="badge badge-neutral badge-sm font-semibold text-[10px] bg-base-300/80 text-base-content/60 border-none">
							Expiré
						</span>
					{/if}
				</div>
				<p class="text-xs text-base-content/60 mt-1">
					Créée le {formatDateWithTime(order.createdAt)}
				</p>
			</div>

			<button
				type="button"
				class="btn btn-ghost btn-square btn-sm rounded-none text-base-content/60 hover:text-base-content"
				onclick={onClose}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Body Content with internal scrollbar -->
		<div class="p-6 flex-1 overflow-y-auto space-y-8 min-h-0">
			<!-- Section 1: Client -->
			<div class="space-y-3">
				<h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider flex items-center gap-2 border-b border-base-200/70 pb-2">
					<User size={15} class="text-primary" />
					Informations Client
				</h3>
				<div class="bg-base-200/40 p-4 rounded-none border border-base-200/60 space-y-2 text-xs">
					<div class="flex items-center justify-between">
						<span class="font-bold text-base-content">{order.customerName}</span>
						{#if order.userId}
							<span class="text-[10px] font-mono text-base-content/40">ID: {order.userId}</span>
						{/if}
					</div>
					<div class="flex items-center gap-2 text-base-content/70">
						<Mail size={13} class="shrink-0" />
						<a href="mailto:{order.customerEmail}" class="hover:underline">{order.customerEmail}</a>
					</div>
					{#if order.customerPhone}
						<div class="flex items-center gap-2 text-base-content/70">
							<Phone size={13} class="shrink-0" />
							<a href="https://wa.me/{order.customerPhone.replace(/[^0-9]/g, '')}" target="_blank" rel="noreferrer" class="hover:underline font-mono">
								{order.customerPhone} (WhatsApp)
							</a>
						</div>
					{/if}
				</div>
			</div>

			<!-- Section 2: Produit acheté -->
			<div class="space-y-3">
				<h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider flex items-center gap-2 border-b border-base-200/70 pb-2">
					<ShoppingBag size={15} class="text-primary" />
					Produit Acheté
				</h3>
				<div class="bg-base-200/40 p-4 rounded-none border border-base-200/60 flex items-center justify-between gap-4">
					<div>
						<span class="font-bold text-xs text-base-content block">{order.productTitle}</span>
						<span class="text-[11px] text-base-content/50 font-mono">Ref Produit: {order.productId}</span>
					</div>

					{#if order.type === 'course'}
						<span class="badge badge-primary badge-sm font-bold text-[10px] bg-black text-white border-none shrink-0">
							Cours
						</span>
					{:else if order.type === 'ebook'}
						<span class="badge badge-secondary badge-sm font-bold text-[10px] shrink-0">
							Ebook
						</span>
					{:else}
						<span class="badge badge-accent badge-sm font-bold text-[10px] shrink-0">
							Coaching
						</span>
					{/if}
				</div>
			</div>

			<!-- Section 3: Détails du Paiement -->
			<div class="space-y-3">
				<h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider flex items-center gap-2 border-b border-base-200/70 pb-2">
					<CreditCard size={15} class="text-primary" />
					Paiement & Transaction
				</h3>
				<div class="bg-base-200/40 p-4 rounded-none border border-base-200/60 space-y-3 text-xs">
					<div class="flex items-center justify-between border-b border-base-200/50 pb-2">
						<span class="text-base-content/60">Montant total :</span>
						<span class="font-bold text-sm text-base-content">{order.amount.toLocaleString('fr-FR')} {order.currency}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-base-content/60">Moyen de paiement :</span>
						<span class="font-semibold text-base-content">{order.paymentProvider || 'Non renseigné'}</span>
					</div>
					{#if order.paymentId}
						<div class="flex items-center justify-between">
							<span class="text-base-content/60">ID Transaction :</span>
							<span class="font-mono font-semibold text-base-content">{order.paymentId}</span>
						</div>
					{/if}
					<div class="flex items-center justify-between">
						<span class="text-base-content/60">Statut du paiement :</span>
						<span class="font-bold text-base-content uppercase">{order.status}</span>
					</div>
					{#if order.paidAt}
						<div class="flex items-center justify-between pt-1 border-t border-base-200/50">
							<span class="text-base-content/60">Date du paiement :</span>
							<span class="font-medium text-base-content">{formatDateWithTime(order.paidAt)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Section 4: Statut de l'Accès / Livraison -->
			<div class="space-y-3">
				<h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider flex items-center gap-2 border-b border-base-200/70 pb-2">
					<CheckCircle2 size={15} class="text-primary" />
					Vérification de l'Accès
				</h3>

				<div class="p-4 rounded-none border border-base-200/60 text-xs space-y-2 {order.status === 'paid' ? 'bg-success/10 border-success/30' : 'bg-base-200/30'}">
					{#if order.status === 'paid' && order.accessGranted === true}
						<div class="flex items-center gap-2 font-bold text-success text-sm">
							<CheckCircle2 size={18} />
							{#if order.type === 'course'}
								<span>Accès au cours : Accordé</span>
							{:else if order.type === 'ebook'}
								<span>Accès à l'ebook : Accordé</span>
							{:else}
								<span>Réservation : Confirmée</span>
							{/if}
						</div>
						<p class="text-[11px] text-base-content/70">
							Le paiement est validé. L'accès a été débloqué automatiquement dans l'espace client.
						</p>
					{:else if order.status === 'paid'}
						<div class="flex items-center gap-2 font-bold text-warning text-sm">
							<AlertTriangle size={18} />
							<span>Paiement validé — accès à vérifier</span>
						</div>
						<p class="text-[11px] text-base-content/70">L’API n’a pas confirmé l’octroi de l’accès pour cette commande.</p>
					{:else if order.status === 'pending'}
						<div class="flex items-center gap-2 font-bold text-warning text-sm">
							<Clock size={18} />
							<span>Accès suspendu (En attente de paiement)</span>
						</div>
						<p class="text-[11px] text-base-content/70">
							La transaction est en cours de traitement par le fournisseur de paiement.
						</p>
					{:else if order.status === 'failed'}
						<div class="flex items-center gap-2 font-bold text-error text-sm">
							<XCircle size={18} />
							<span>Échec de transaction</span>
						</div>
						<p class="text-[11px] text-base-content/70">
							La tentative de paiement a échoué. Aucun accès n'a été accordé.
						</p>
					{:else}
						<div class="flex items-center gap-2 font-bold text-base-content/60 text-sm">
							<AlertTriangle size={18} />
							<span>Commande expirée</span>
						</div>
						<p class="text-[11px] text-base-content/70">
							Le délai de paiement est dépassé. La commande a été annulée.
						</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Footer Actions -->
		<div class="p-6 border-t border-base-200 flex items-center justify-end shrink-0 bg-base-100">
			<button
				type="button"
				class="btn bg-black text-white hover:bg-black/90 border-none rounded-none text-xs font-semibold px-6"
				onclick={onClose}
			>
				Fermer
			</button>
		</div>
	</div>
{/if}
