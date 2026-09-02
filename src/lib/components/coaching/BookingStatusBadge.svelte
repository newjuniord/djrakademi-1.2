<script lang="ts">
	import type { BookingStatus } from '$lib/types/coaching';
	let { status }: { status: BookingStatus } = $props();
	const labels: Record<BookingStatus, string> = {
		pending_payment: 'Paiement en attente', confirmed: 'Confirmée', completed: 'Terminée', cancelled: 'Annulée', expired: 'Expirée'
	};
	const classes: Record<BookingStatus, string> = {
		pending_payment: 'badge-warning', confirmed: 'badge-success', completed: 'badge-primary', cancelled: 'badge-error', expired: 'badge-ghost'
	};
</script>

<span class={`badge badge-sm whitespace-nowrap ${classes[status]}`}>{labels[status]}</span>
