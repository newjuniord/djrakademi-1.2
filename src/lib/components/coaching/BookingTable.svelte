<script lang="ts">
	import { CheckCircle2, Eye, MessageCircle, XCircle } from 'lucide-svelte';
	import { formatDateTimeInTimezone } from '$lib/coaching/timezone';
	import { whatsappLink } from '$lib/coaching/validation';
	import type { Booking, BookingStatus, CoachingService } from '$lib/types/coaching';
	import BookingStatusBadge from './BookingStatusBadge.svelte';

	let { bookings, services, coachTimezone, onStatusChange }: {
		bookings: Booking[]; services: CoachingService[]; coachTimezone: string;
		onStatusChange: (id: string, status: BookingStatus) => void;
	} = $props();

	let selected = $state<Booking | null>(null);
	let confirmAction = $state<{ booking: Booking; type: 'completed' | 'cancelled' } | null>(null);
	let confirmInputText = $state('');

	const getService = (id: string) => services.find((service) => service.id === id);
	const serviceTitle = (id: string) => getService(id)?.title ?? 'Coaching';
	const formatAmount = (b: Booking) => {
		const s = getService(b.serviceId);
		const amt = b.amount || s?.price || 0;
		if (amt > 0) {
			const sUsd = Number(s?.priceUsd || 0);
			return sUsd > 0 ? `${amt.toLocaleString('fr-FR')} HTG ($${sUsd} USD)` : `${amt.toLocaleString('fr-FR')} HTG`;
		}
		return s?.isFree ? 'Gratuit' : 'Paiement en attente';
	};

	function requestCancel(b: Booking) {
		confirmInputText = '';
		confirmAction = { booking: b, type: 'cancelled' };
	}

	function requestComplete(b: Booking) {
		confirmInputText = '';
		confirmAction = { booking: b, type: 'completed' };
	}

	function handleConfirm() {
		if (!confirmAction) return;
		const expected = confirmAction.type === 'cancelled' ? 'ANNULER' : 'TERMINER';
		if (confirmInputText.trim() !== expected) return;

		onStatusChange(confirmAction.booking.id, confirmAction.type);
		if (selected?.id === confirmAction.booking.id) {
			selected = null;
		}
		confirmAction = null;
		confirmInputText = '';
	}
</script>

<div class="overflow-x-auto">
	<table class="table min-w-[980px]">
		<thead><tr><th>Client</th><th>WhatsApp</th><th>Coaching</th><th>Date</th><th>Heure</th><th>Montant</th><th>Statut</th><th class="text-right">Actions</th></tr></thead>
		<tbody>{#each bookings as booking (booking.id)}
			{@const local = formatDateTimeInTimezone(booking.startAt, coachTimezone)}
			<tr>
				<td><button class="font-medium hover:text-primary" type="button" onclick={() => (selected = booking)}>{booking.customerName}</button><span class="block text-xs text-base-content/50">{booking.customerEmail}</span></td>
				<td><a class="link link-primary" href={whatsappLink(booking.customerWhatsapp, `Bonjour ${booking.customerName}, au sujet de votre réservation…`)} target="_blank" rel="noreferrer">{booking.customerWhatsapp}</a></td>
				<td>{serviceTitle(booking.serviceId)}</td><td class="capitalize">{local.date}</td><td>{local.time}</td><td>{formatAmount(booking)}</td><td><BookingStatusBadge status={booking.status} /></td>
				<td><div class="flex justify-end gap-1"><button class="btn btn-ghost btn-square btn-sm" type="button" aria-label="Voir la réservation" onclick={() => (selected = booking)}><Eye size={17} /></button><a class="btn btn-ghost btn-square btn-sm text-success" aria-label="Ouvrir WhatsApp" href={whatsappLink(booking.customerWhatsapp, `Bonjour ${booking.customerName}, au sujet de votre réservation…`)} target="_blank" rel="noreferrer"><MessageCircle size={17} /></a>{#if booking.status === 'confirmed'}<button class="btn btn-ghost btn-square btn-sm text-primary" type="button" aria-label="Marquer terminée" onclick={() => requestComplete(booking)}><CheckCircle2 size={17} /></button>{/if}{#if booking.status === 'confirmed' || booking.status === 'pending_payment'}<button class="btn btn-ghost btn-square btn-sm text-error" type="button" aria-label="Annuler" onclick={() => requestCancel(booking)}><XCircle size={17} /></button>{/if}</div></td>
			</tr>
		{/each}</tbody>
	</table>
</div>

{#if selected}
	<div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
		<div class="modal-box max-w-2xl"><button class="btn btn-ghost btn-sm btn-circle absolute right-3 top-3" type="button" aria-label="Fermer" onclick={() => (selected = null)}>✕</button><h2 id="booking-modal-title" class="text-xl font-bold">Détails de la réservation</h2>
			<div class="mt-5 grid gap-4 sm:grid-cols-2">
				{#each [['Nom', selected.customerName], ['Email', selected.customerEmail], ['WhatsApp', selected.customerWhatsapp], ['Service', serviceTitle(selected.serviceId)], ['Date et heure coach', `${formatDateTimeInTimezone(selected.startAt, selected.coachTimezone).date} · ${formatDateTimeInTimezone(selected.startAt, selected.coachTimezone).time}`], ['Fuseau client', selected.customerTimezone], ['Fuseau coach', selected.coachTimezone], ['Montant', formatAmount(selected)], ['Paiement', selected.paymentStatus], ['Créée le', new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.createdAt))]] as field}
					<div><p class="text-xs text-base-content/50">{field[0]}</p><p class="mt-1 font-medium">{field[1]}</p></div>
				{/each}
			</div>
			<div class="modal-action flex-wrap"><a class="btn btn-success" href={whatsappLink(selected.customerWhatsapp, `Bonjour ${selected.customerName}, au sujet de votre réservation…`)} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>{#if selected.status === 'confirmed'}<button class="btn btn-primary" type="button" onclick={() => requestComplete(selected!)}>Terminer</button>{/if}{#if selected.status !== 'cancelled' && selected.status !== 'completed'}<button class="btn btn-outline btn-error" type="button" onclick={() => requestCancel(selected!)}>Annuler</button>{/if}</div>
		</div><button class="modal-backdrop" type="button" aria-label="Fermer" onclick={() => (selected = null)}>close</button>
	</div>
{/if}

{#if confirmAction}
	{@const isCancel = confirmAction.type === 'cancelled'}
	{@const expectedWord = isCancel ? 'ANNULER' : 'TERMINER'}
	<div class="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
		<div class="modal-box max-w-md space-y-4">
			<button
				class="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
				type="button"
				aria-label="Fermer"
				onclick={() => { confirmAction = null; confirmInputText = ''; }}
			>✕</button>
			<div class="flex items-center gap-3">
				<div class="grid size-12 place-items-center rounded-2xl {isCancel ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}">
					{#if isCancel}
						<XCircle size={26} />
					{:else}
						<CheckCircle2 size={26} />
					{/if}
				</div>
				<div>
					<h3 id="confirm-modal-title" class="text-lg font-bold">
						{isCancel ? 'Confirmer l’annulation du coaching' : 'Confirmer la fin du coaching'}
					</h3>
					<p class="text-xs text-base-content/60">
						{confirmAction.booking.customerName} · {serviceTitle(confirmAction.booking.serviceId)}
					</p>
				</div>
			</div>

			<div class="rounded-xl border border-base-300 bg-base-200/50 p-4 text-xs space-y-2">
				<p class="text-base-content/80 font-medium">
					{#if isCancel}
						Veuillez saisir <strong class="text-error font-mono font-bold">ANNULER</strong> ci-dessous pour confirmer l’annulation de cette réservation.
					{:else}
						Veuillez saisir <strong class="text-primary font-mono font-bold">TERMINER</strong> ci-dessous pour confirmer que le coaching est terminé.
					{/if}
				</p>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleConfirm(); }} class="space-y-4">
				<div class="form-control">
					<label class="label text-xs font-semibold" for="confirm-input">
						Saisissez « {expectedWord} » pour confirmer :
					</label>
					<input
						id="confirm-input"
						type="text"
						class="input input-bordered w-full font-mono uppercase font-bold tracking-wider"
						placeholder={`Saisissez ${expectedWord} ici...`}
						bind:value={confirmInputText}
						autocomplete="off"
					/>
				</div>

				<div class="modal-action">
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => { confirmAction = null; confirmInputText = ''; }}
					>
						Fermer
					</button>
					<button
						type="submit"
						disabled={confirmInputText.trim() !== expectedWord}
						class="btn {isCancel ? 'btn-error' : 'btn-primary'} font-bold"
					>
						{isCancel ? 'Confirmer l’annulation' : 'Confirmer la fin'}
					</button>
				</div>
			</form>
		</div>
		<button class="modal-backdrop" type="button" aria-label="Fermer" onclick={() => { confirmAction = null; confirmInputText = ''; }}>close</button>
	</div>
{/if}
