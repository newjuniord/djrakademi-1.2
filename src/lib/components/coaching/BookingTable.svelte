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
	const serviceTitle = (id: string) => services.find((service) => service.id === id)?.title ?? 'Coaching';
</script>

<div class="overflow-x-auto">
	<table class="table min-w-[980px]">
		<thead><tr><th>Client</th><th>WhatsApp</th><th>Coaching</th><th>Date</th><th>Heure</th><th>Montant</th><th>Statut</th><th class="text-right">Actions</th></tr></thead>
		<tbody>{#each bookings as booking (booking.id)}
			{@const local = formatDateTimeInTimezone(booking.startAt, coachTimezone)}
			<tr>
				<td><button class="font-medium hover:text-primary" type="button" onclick={() => (selected = booking)}>{booking.customerName}</button><span class="block text-xs text-base-content/50">{booking.customerEmail}</span></td>
				<td><a class="link link-primary" href={whatsappLink(booking.customerWhatsapp, `Bonjour ${booking.customerName}, au sujet de votre réservation…`)} target="_blank" rel="noreferrer">{booking.customerWhatsapp}</a></td>
				<td>{serviceTitle(booking.serviceId)}</td><td class="capitalize">{local.date}</td><td>{local.time}</td><td>{booking.amount ? `${booking.amount.toLocaleString('fr-FR')} HTG` : 'Gratuit'}</td><td><BookingStatusBadge status={booking.status} /></td>
				<td><div class="flex justify-end gap-1"><button class="btn btn-ghost btn-square btn-sm" type="button" aria-label="Voir la réservation" onclick={() => (selected = booking)}><Eye size={17} /></button><a class="btn btn-ghost btn-square btn-sm text-success" aria-label="Ouvrir WhatsApp" href={whatsappLink(booking.customerWhatsapp, `Bonjour ${booking.customerName}, au sujet de votre réservation…`)} target="_blank" rel="noreferrer"><MessageCircle size={17} /></a>{#if booking.status === 'confirmed'}<button class="btn btn-ghost btn-square btn-sm text-primary" type="button" aria-label="Marquer terminée" onclick={() => onStatusChange(booking.id, 'completed')}><CheckCircle2 size={17} /></button>{/if}{#if booking.status === 'confirmed' || booking.status === 'pending_payment'}<button class="btn btn-ghost btn-square btn-sm text-error" type="button" aria-label="Annuler" onclick={() => onStatusChange(booking.id, 'cancelled')}><XCircle size={17} /></button>{/if}</div></td>
			</tr>
		{/each}</tbody>
	</table>
</div>

{#if selected}
	<div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
		<div class="modal-box max-w-2xl"><button class="btn btn-ghost btn-sm btn-circle absolute right-3 top-3" type="button" aria-label="Fermer" onclick={() => (selected = null)}>✕</button><h2 id="booking-modal-title" class="text-xl font-bold">Détails de la réservation</h2>
			<div class="mt-5 grid gap-4 sm:grid-cols-2">
				{#each [['Nom', selected.customerName], ['Email', selected.customerEmail], ['WhatsApp', selected.customerWhatsapp], ['Service', serviceTitle(selected.serviceId)], ['Date et heure coach', `${formatDateTimeInTimezone(selected.startAt, selected.coachTimezone).date} · ${formatDateTimeInTimezone(selected.startAt, selected.coachTimezone).time}`], ['Fuseau client', selected.customerTimezone], ['Fuseau coach', selected.coachTimezone], ['Montant', selected.amount ? `${selected.amount.toLocaleString('fr-FR')} HTG` : 'Gratuit'], ['Paiement', selected.paymentStatus], ['Créée le', new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.createdAt))]] as field}
					<div><p class="text-xs text-base-content/50">{field[0]}</p><p class="mt-1 font-medium">{field[1]}</p></div>
				{/each}
			</div>
			<div class="modal-action flex-wrap"><a class="btn btn-success" href={whatsappLink(selected.customerWhatsapp, `Bonjour ${selected.customerName}, au sujet de votre réservation…`)} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>{#if selected.status === 'confirmed'}<button class="btn btn-primary" type="button" onclick={() => { onStatusChange(selected!.id, 'completed'); selected = null; }}>Terminer</button>{/if}{#if selected.status !== 'cancelled' && selected.status !== 'completed'}<button class="btn btn-outline btn-error" type="button" onclick={() => { onStatusChange(selected!.id, 'cancelled'); selected = null; }}>Annuler</button>{/if}</div>
		</div><button class="modal-backdrop" type="button" aria-label="Fermer" onclick={() => (selected = null)}>close</button>
	</div>
{/if}
