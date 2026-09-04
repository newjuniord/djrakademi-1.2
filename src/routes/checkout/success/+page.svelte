<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		CheckCircle2,
		Loader2,
		AlertCircle,
		BookOpen,
		FileText,
		CalendarClock,
		ArrowRight,
		Receipt,
		Printer,
		MessageSquare,
		Sparkles,
		ShieldCheck,
		LayoutDashboard
	} from 'lucide-svelte';
	import { confirmPlopplopPayment } from '$lib/services/payments';
	import type { Order } from '$lib/services/orders';

	let orderId = $state<string | null>(null);
	let order = $state<Order | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let emailSent = $state<boolean | null>(null);

	onMount(async () => {
		orderId =
			page.url.searchParams.get('refference_id') ||
			page.url.searchParams.get('orderId') ||
			page.url.searchParams.get('order_id') ||
			page.url.searchParams.get('id');

		if (!orderId) {
			error = 'Aucun numéro de commande spécifié dans l\'URL.';
			loading = false;
			return;
		}

		await verifyPayment();
	});

	async function verifyPayment() {
		loading = true;
		error = null;
		order = null;
		try {
			const data = await confirmPlopplopPayment(orderId!);
			if (data.success && data.order?.status === 'paid') {
				order = data.order;
				emailSent = data.emailSent ?? null;
			} else {
				error = data.message || 'Le paiement est toujours en attente de confirmation.';
			}
		} catch {
			error = 'Erreur réseau lors de la vérification du paiement.';
		} finally {
			loading = false;
		}
	}

	function printReceipt() {
		window.print();
	}
</script>

<svelte:head>
	<title>Konfimasyon Kòmand · DJR Akademi</title>
</svelte:head>

<div class="min-h-[85vh] bg-base-200/50 py-12 px-4 sm:px-6 lg:px-8 grid place-items-center">
	<div class="w-full max-w-2xl space-y-6">
		{#if loading}
			<!-- Loading State -->
			<div class="card bg-base-100 border border-base-300/80 shadow-xl p-10 text-center space-y-6 animate-pulse">
				<div class="relative mx-auto size-20 grid place-items-center">
					<div class="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
					<Loader2 size={44} class="animate-spin text-primary relative z-10" />
				</div>
				<div class="space-y-2">
					<h1 class="text-xl sm:text-2xl font-bold text-base-content">N ap verifye peman an…</h1>
					<p class="text-xs sm:text-sm text-base-content/60 max-w-md mx-auto">
						N ap konfime tranzaksyon w lan avèk sistèm peman an. Tanpri pa fèmen paj sa a.
					</p>
				</div>
			</div>
		{:else if error && !order}
			<!-- Error State -->
			<div class="card bg-base-100 border border-error/30 shadow-xl p-8 sm:p-10 text-center space-y-6">
				<div class="grid size-16 place-items-center rounded-full bg-error/10 text-error mx-auto">
					<AlertCircle size={36} />
				</div>
				<div class="space-y-2">
					<h1 class="text-2xl font-bold text-base-content">Nou pa ka verifye kòmand lan</h1>
					<p class="text-sm text-base-content/60 max-w-md mx-auto">{error}</p>
				</div>
				<div class="pt-4 flex flex-wrap items-center justify-center gap-3">
					<a href="/dashboard" class="btn btn-primary btn-sm rounded-xl font-bold px-6 gap-2">
						<LayoutDashboard size={16} />
						Ale nan Espas mwen (Dashboard)
					</a>
					<button type="button" class="btn btn-outline btn-sm rounded-xl font-bold px-6" onclick={verifyPayment}>
						Eseye verifye ankò
					</button>
					<a href="/contact" class="btn btn-ghost btn-sm rounded-xl font-bold px-6 border border-base-300">
						Kontakte sipò a
					</a>
				</div>
			</div>
		{:else if order}
			<!-- Success State -->
			<div class="card bg-base-100 border border-base-300/70 shadow-2xl overflow-hidden print:shadow-none print:border-none">
				<!-- Top Status Banner -->
				<div class="bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white p-8 sm:p-10 text-center space-y-4 relative overflow-hidden">
					<div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
						<Sparkles size={200} />
					</div>

					<div class="grid size-20 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md mx-auto shadow-inner ring-4 ring-white/30">
						<CheckCircle2 size={46} class="stroke-[2.5]" />
					</div>

					<div class="space-y-1">
						<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-emerald-100 mb-2">
							<ShieldCheck size={14} /> Peman Konfime
						</div>
						<h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight">Mèsi pou kòmand ou an !</h1>
						<p class="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
							Tranzaksyon ou an konfime avèk siksè.
							{#if emailSent === true} Yon imèl aksè voye bay <strong class="text-white">{order.customerEmail}</strong>.{:else if emailSent === false} Achte w la disponib nan kont ou; imèl la pa t ka voye pou kounye a.{/if}
						</p>
					</div>
				</div>

				<!-- Content Body -->
				<div class="p-6 sm:p-8 space-y-6">
					<!-- Purchased Item Card -->
					<div class="rounded-2xl border border-base-300/80 bg-base-200/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div class="flex items-center gap-4">
							<div class="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
								{#if order.productType === 'course'}
									<BookOpen size={28} />
								{:else if order.productType === 'ebook'}
									<FileText size={28} />
								{:else}
									<CalendarClock size={28} />
								{/if}
							</div>
							<div>
								<span class="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
									{order.productType === 'course' ? 'Fòmasyon sou entènèt' : order.productType === 'ebook' ? 'E-book PDF' : 'Sesyon Coaching'}
								</span>
								<h2 class="text-base sm:text-lg font-bold text-base-content mt-1 line-clamp-1">{order.productTitle}</h2>
								<p class="text-xs text-base-content/50">Kliyan : {order.customerName}</p>
							</div>
						</div>

						<div class="text-right sm:border-l sm:border-base-300 sm:pl-5 shrink-0">
							<span class="text-xs text-base-content/50 block">Montan peye</span>
							<span class="text-xl font-extrabold text-base-content">{order.amount.toLocaleString('fr-FR')} {order.currency || 'HTG'}</span>
						</div>
					</div>

					<!-- Receipt Details Table -->
					<div class="rounded-2xl border border-base-300/70 p-5 space-y-3 bg-base-100 text-xs">
						<div class="flex items-center justify-between border-b border-base-200 pb-3">
							<span class="font-bold text-base-content/70 flex items-center gap-1.5">
								<Receipt size={15} class="text-primary" /> Detay resi an
							</span>
							<span class="font-mono text-base-content/50"># {order.id}</span>
						</div>

						<div class="grid grid-cols-2 gap-3 pt-1 text-xs">
							<div>
								<span class="text-base-content/50 block">Sitiyasyon peman an</span>
								<span class="font-bold text-emerald-600 dark:text-emerald-400 capitalize">Valab ({order.status})</span>
							</div>
							<div>
								<span class="text-base-content/50 block">Mwayen peman</span>
								<span class="font-bold text-base-content uppercase">{order.paymentProvider || 'MonCash'}</span>
							</div>
							<div>
								<span class="text-base-content/50 block">Dat tranzaksyon an</span>
								<span class="font-medium text-base-content">
									{new Date(order.paidAt || order.createdAt).toLocaleDateString('fr-FR', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</span>
							</div>
							<div>
								<span class="text-base-content/50 block">ID Peman</span>
								<span class="font-mono font-semibold text-base-content truncate block max-w-[180px]">{order.paymentId || order.id}</span>
							</div>
						</div>
					</div>

					<!-- Primary CTA Actions -->
					<div class="space-y-3 pt-2 print:hidden">
						{#if order.productType === 'course'}
							<a
								href={`/learn/${order.productId}`}
								class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>Jwenn aksè nan fòmasyon an kounye a</span>
								<ArrowRight size={18} />
							</a>
						{:else if order.productType === 'ebook'}
							<a
								href={`/ebooks/${order.productId}`}
								class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>Gade &amp; Telechaje E-book la</span>
								<ArrowRight size={18} />
							</a>
						{:else}
							<a
								href={`/booking/${order.productId}/success`}
								class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>Gade detay rendez-vous an</span>
								<ArrowRight size={18} />
							</a>
						{/if}

						<div class="flex flex-col sm:flex-row items-center gap-3">
							<a
								href="/transactions"
								class="btn btn-outline min-h-10 flex-1 w-full rounded-xl text-xs font-semibold gap-1.5"
							>
								<Receipt size={15} /> Gade tout tranzaksyon m yo
							</a>

							<button
								type="button"
								onclick={printReceipt}
								class="btn btn-ghost min-h-10 rounded-xl text-xs font-semibold gap-1.5 border border-base-300"
							>
								<Printer size={15} /> Enprime resi an
							</button>
						</div>
					</div>

					<!-- Assistance Footer -->
					<div class="text-center pt-4 border-t border-base-200 text-xs text-base-content/60 print:hidden flex items-center justify-between">
						<span>Ou gen yon kesyon sou kòmand ou an ?</span>
						{#if order.productType === 'coaching'}
							<a
								href="https://wa.me/50937001234?text=Bonjou,%20mwen%20gen%20yon%20kesyon%20sou%20rez%C3%A8vasyon%20coaching%20mwen%20an"
								target="_blank"
								rel="noreferrer"
								class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
							>
								<MessageSquare size={14} /> Sipò WhatsApp Coaching
							</a>
						{:else}
							<a
								href="/contact"
								class="text-primary font-bold hover:underline inline-flex items-center gap-1"
							>
								Paj Kontakte n
							</a>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
