<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		CheckCircle2,
		Loader2,
		AlertCircle,
		AlertTriangle,
		HelpCircle,
		BookOpen,
		FileText,
		CalendarClock,
		ArrowRight,
		Receipt,
		Printer,
		MessageSquare,
		Sparkles,
		ShieldCheck,
		LayoutDashboard,
		RefreshCw
	} from 'lucide-svelte';

	interface LemonOrder {
		id: string;
		customerName: string;
		customerEmail: string;
		productType: 'course' | 'ebook' | 'coaching';
		productId: string;
		productTitle: string;
		amount: number;
		currency: string;
		paymentProvider: string;
		status: 'paid' | 'pending' | 'failed' | 'expired';
		createdAt: string;
		paidAt?: string;
	}

	let orderId = $state<string | null>(null);
	let order = $state<LemonOrder | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let verifying = $state(false);

	onMount(async () => {
		orderId =
			page.url.searchParams.get('order_id') ||
			page.url.searchParams.get('orderId') ||
			page.url.searchParams.get('refference_id') ||
			page.url.searchParams.get('id');

		if (!orderId) {
			error = 'Okenn nimewo kòmand pa jwenn nan lyen an.';
			loading = false;
			return;
		}

		await verifyLemonSqueezyOrder();
	});

	async function verifyLemonSqueezyOrder() {
		if (!orderId) return;
		loading = true;
		verifying = true;
		error = null;
		order = null;

		try {
			const res = await fetch(`/api/lemonsqueezy/verify?order_id=${encodeURIComponent(orderId)}`, {
				method: 'GET',
				headers: { Accept: 'application/json' }
			});
			const data = await res.json().catch(() => null);

			if (res.ok && data?.order) {
				order = data.order;
				if (data.order.status !== 'paid') {
					error = 'Peman pa kat la ap trete toujou oswa li pa t ka konfime. Si w te peye deja, klike sou bouton anba a pou n re-verifye aksè w la.';
				}
			} else {
				error = data?.message || 'Nou pa t ka verifye tranzaksyon Lemon Squeezy an.';
			}
		} catch {
			error = 'Erè rezo lè n t ap verifye peman Lemon Squeezy an.';
		} finally {
			loading = false;
			verifying = false;
		}
	}

	function printReceipt() {
		window.print();
	}
</script>

<svelte:head>
	<title>Konfimasyon Peman Kat · DJR Akademi</title>
</svelte:head>

<div class="min-h-[85vh] bg-base-200/50 py-12 px-4 sm:px-6 lg:px-8 grid place-items-center">
	<div class="w-full max-w-2xl space-y-6">
		{#if loading}
			<!-- Loading State -->
			<div class="card bg-base-100 border border-base-300/80 shadow-xl p-10 text-center space-y-6 animate-pulse">
				<div class="relative mx-auto size-20 grid place-items-center">
					<div class="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
					<Loader2 size={44} class="animate-spin text-amber-500 relative z-10" />
				</div>
				<div class="space-y-2">
					<h1 class="text-xl sm:text-2xl font-bold text-base-content">N ap verifye peman pa kat la (Lemon Squeezy)…</h1>
					<p class="text-xs sm:text-sm text-base-content/60 max-w-md mx-auto">
						N ap verifye si w gen kou/ebook la deja oswa si tranzaksyon kat la konfime ak siksè.
					</p>
				</div>
			</div>
		{:else if !orderId}
			<!-- Missing Order ID State -->
			<div class="card bg-base-100 border border-base-300/80 shadow-2xl overflow-hidden p-8 sm:p-10 text-center space-y-6">
				<div class="relative mx-auto size-20 grid place-items-center">
					<div class="absolute inset-0 rounded-full bg-amber-500/10 blur-xl"></div>
					<div class="grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 shadow-inner">
						<HelpCircle size={36} />
					</div>
				</div>

				<div class="space-y-2">
					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
						Lyen enkonplè
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">Okenn nimewo kòmand pa jwenn</h1>
					<p class="text-sm text-base-content/65 max-w-md mx-auto leading-relaxed">
						Paj sa a mande yon kòd tranzaksyon pou l ka afiche resi w la. Si w te fè yon achte ak kat, tanpri verifye lyen ki nan imèl konfimasyon w la oswa konsilte istwa tranzaksyon w yo.
					</p>
				</div>

				<div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
					<a href="/transactions" class="btn bg-amber-500 hover:bg-amber-600 text-black border-none btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto shadow-md">
						<Receipt size={18} />
						Konsilte tranzaksyon m yo
					</a>
					<a href="/dashboard" class="btn btn-outline btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto">
						<LayoutDashboard size={18} />
						Ale nan Espas mwen
					</a>
				</div>

				<div class="pt-4 border-t border-base-200 flex flex-wrap items-center justify-center gap-2 text-xs text-base-content/60">
					<span>Ou bezwen èd ?</span>
					<a
						href="https://wa.me/50937001234?text=Bonjou,%20mwen%20sou%20paj%20verifikasyon%20Lemon%20Squeezy%20men%20mwen%20pa%20gen%20order_id"
						target="_blank"
						rel="noreferrer"
						class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
					>
						<MessageSquare size={14} /> Kòmanse yon chat WhatsApp
					</a>
				</div>
			</div>
		{:else if error && (!order || order.status !== 'paid')}
			<!-- Pending / Error State with orderId present -->
			<div class="card bg-base-100 border border-amber-500/30 shadow-2xl overflow-hidden p-8 sm:p-10 text-center space-y-6 relative">
				<div class="absolute -top-12 -right-12 size-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

				<div class="relative mx-auto size-20 grid place-items-center">
					<div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-25"></div>
					<div class="grid size-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-lg">
						<AlertTriangle size={36} />
					</div>
				</div>

				<div class="space-y-2">
					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
						<RefreshCw size={12} class={verifying ? "animate-spin" : ""} /> Verifikasyon Peman Kat
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">Kòmand #<span class="font-mono">{orderId}</span></h1>
					<p class="text-sm text-base-content/70 max-w-md mx-auto leading-relaxed">
						{error}
					</p>
				</div>

				<div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
					<button
						type="button"
						disabled={verifying}
						class="btn bg-amber-500 hover:bg-amber-600 text-black border-none btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50"
						onclick={verifyLemonSqueezyOrder}
					>
						<RefreshCw size={18} class={verifying ? "animate-spin" : ""} />
						{verifying ? 'N ap re-verifye...' : 'Re-verifye aksè mwen an kounye a'}
					</button>
					<a href="/dashboard" class="btn btn-outline btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto">
						<LayoutDashboard size={18} />
						Ale nan Espas mwen
					</a>
				</div>

				<div class="p-4 rounded-2xl bg-base-200/50 border border-base-300/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-left">
					<div class="space-y-0.5">
						<span class="font-bold text-base-content block">Peman an te debouse deja ?</span>
						<span class="text-base-content/60">Si tranzaksyon ou an konfime sou kat ou men li toujou endisponib, kontakte sipò a rapidman.</span>
					</div>
					<a
						href={`https://wa.me/50937001234?text=Bonjou,%20mwen%20f%C3%A8%20yon%20peman%20kat%20LemonSqueezy%20pou%20k%C3%B2mand%20%23${encodeURIComponent(orderId)}%20men%20verifikasyon%20an%20toujou%20en%20pou.`}
						target="_blank"
						rel="noreferrer"
						class="btn text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-none font-bold rounded-xl shrink-0 gap-1.5"
					>
						<MessageSquare size={14} /> Sipò WhatsApp
					</a>
				</div>
			</div>
		{:else if order}
			<!-- Success State -->
			<div class="card bg-base-100 border border-base-300/70 shadow-2xl overflow-hidden print:shadow-none print:border-none">
				<!-- Top Status Banner -->
				<div class="bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 text-white p-8 sm:p-10 text-center space-y-4 relative overflow-hidden">
					<div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
						<Sparkles size={200} />
					</div>

					<div class="grid size-20 place-items-center rounded-full bg-amber-500 text-black font-black mx-auto shadow-inner ring-4 ring-amber-400/30">
						<CheckCircle2 size={46} class="stroke-[2.5]" />
					</div>

					<div class="space-y-1">
						<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
							<ShieldCheck size={14} /> Peman pa Kat Konfime (Lemon Squeezy)
						</div>
						<h1 class="text-2xl sm:text-4xl font-black tracking-tight">Mèsi pou kòmand ou an !</h1>
						<p class="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto">
							Tranzaksyon ou an konfime nan sistèm nan. Aksè ou a debloke nèt nan kont ou.
						</p>
					</div>
				</div>

				<!-- Content Body -->
				<div class="p-6 sm:p-8 space-y-6">
					<!-- Purchased Item Card -->
					<div class="rounded-2xl border border-base-300/80 bg-base-200/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div class="flex items-center gap-4">
							<div class="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
								{#if order.productType === 'course'}
									<BookOpen size={28} />
								{:else if order.productType === 'ebook'}
									<FileText size={28} />
								{:else}
									<CalendarClock size={28} />
								{/if}
							</div>
							<div>
								<span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
									{order.productType === 'course' ? 'Fòmasyon sou entènèt' : order.productType === 'ebook' ? 'E-book PDF' : 'Sesyon Coaching'}
								</span>
								<h2 class="text-base sm:text-lg font-bold text-base-content mt-1 line-clamp-1">{order.productTitle}</h2>
								<p class="text-xs text-base-content/50">Kliyan : {order.customerName}</p>
							</div>
						</div>

						<div class="text-right sm:border-l sm:border-base-300 sm:pl-5 shrink-0">
							<span class="text-xs text-base-content/50 block">Montan peye (USD)</span>
							<span class="text-xl font-extrabold text-base-content">{order.amount} USD</span>
						</div>
					</div>

					<!-- Receipt Details Table -->
					<div class="rounded-2xl border border-base-300/70 p-5 space-y-3 bg-base-100 text-xs">
						<div class="flex items-center justify-between border-b border-base-200 pb-3">
							<span class="font-bold text-base-content/70 flex items-center gap-1.5">
								<Receipt size={15} class="text-amber-500" /> Detay resi an
							</span>
							<span class="font-mono text-base-content/50"># {order.id.slice(0, 12)}</span>
						</div>

						<div class="grid grid-cols-2 gap-3 pt-1 text-xs">
							<div>
								<span class="text-base-content/50 block">Sitiyasyon peman an</span>
								<span class="font-bold text-emerald-600 dark:text-emerald-400 capitalize">Peye ✓</span>
							</div>
							<div>
								<span class="text-base-content/50 block">Mwayen peman</span>
								<span class="font-bold text-base-content uppercase">Lemon Squeezy (Kat)</span>
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
								<span class="text-base-content/50 block">Deviz</span>
								<span class="font-mono font-bold text-base-content">USD</span>
							</div>
						</div>
					</div>

					<!-- Primary CTA Actions -->
					<div class="space-y-3 pt-2 print:hidden">
						{#if order.productType === 'course'}
							<a
								href={`/learn/${order.productId}`}
								class="btn bg-zinc-950 hover:bg-zinc-800 text-white w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>Swiv kou a kounye a</span>
								<ArrowRight size={18} />
							</a>
						{:else if order.productType === 'ebook'}
							<a
								href={`/ebooks/${order.productId}`}
								class="btn bg-amber-500 hover:bg-amber-600 text-black w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>Swiv &amp; Telechaje E-book la</span>
								<ArrowRight size={18} />
							</a>
						{:else}
							<a
								href={`/booking/${order.productId}/success`}
								class="btn bg-zinc-950 hover:bg-zinc-800 text-white w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
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
						<span>Ou gen yon kesyon sou peman pa kat ou an ?</span>
						<a
							href="https://wa.me/50937001234?text=Bonjour,%20j'ai%20une%20question%20sur%20mon%20paiement%20Lemon%20Squeezy%20"
							target="_blank"
							rel="noreferrer"
							class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
						>
							<MessageSquare size={14} /> Sipò WhatsApp
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
