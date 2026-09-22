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

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			title: 'Confirmation de Commande · DJR Akademi',
			verifyingTitle: 'Vérification du paiement…',
			verifyingDesc: 'Nous confirmons votre transaction avec le système de paiement. Veuillez ne pas fermer cette page.',
			missingOrderId: 'Aucun numéro de commande spécifié dans l\'URL.',
			paymentPending: 'Le paiement est toujours en attente de confirmation.',
			networkError: 'Erreur réseau lors de la vérification du paiement.',
			errorTitle: 'Impossible de vérifier la commande',
			goToDashboard: 'Aller sur mon Espace (Dashboard)',
			retryBtn: 'Réessayer la vérification',
			contactSupport: 'Contacter le support',
			paymentConfirmed: 'Paiement Confimé',
			thanksOrder: 'Merci pour votre commande !',
			txConfirmed: 'Votre transaction a été confirmée avec succès.',
			emailSentSuccess: 'Un e-mail d\'accès a été envoyé à',
			emailSentFail: 'Votre achat est disponible dans votre compte; l\'e-mail n\'a pas pu être envoyé pour le moment.',
			typeCourse: 'Formation en ligne',
			typeEbook: 'E-book PDF',
			typeBundle: 'Bundle',
			typeCoaching: 'Session Coaching',
			customerLabel: 'Client :',
			amountPaidLabel: 'Montant payé',
			receiptTitle: 'Détails du reçu',
			statusLabel: 'Statut du paiement',
			statusValid: 'Validé',
			providerLabel: 'Moyen de paiement',
			dateLabel: 'Date de transaction',
			paymentIdLabel: 'ID Paiement',
			accessCourseNow: 'Accéder à la formation maintenant',
			viewDownloadEbook: 'Voir & Télécharger l\'E-book',
			viewMyResources: 'Voir mes ressources',
			viewBookingDetails: 'Voir les détails du rendez-vous',
			viewTransactions: 'Voir toutes mes transactions',
			printReceipt: 'Imprimer le reçu',
			questionOrder: 'Une question concernant votre commande ?',
			supportWhatsapp: 'Support WhatsApp Coaching',
			contactPage: 'Page Contact'
		},
		ht: {
			title: 'Konfimasyon Kòmand · DJR Akademi',
			verifyingTitle: 'N ap verifye peman an…',
			verifyingDesc: 'N ap konfime tranzaksyon w lan avèk sistèm peman an. Tanpri pa fèmen paj sa a.',
			missingOrderId: 'Okenn nimewo kòmand pa jwenn nan lyen an.',
			paymentPending: 'Peman an ap trete toujou oswa li pa t ka konfime.',
			networkError: 'Erè rezo lè n t ap verifye peman an.',
			errorTitle: 'Nou pa ka verifye kòmand lan',
			goToDashboard: 'Ale nan Espas mwen (Dashboard)',
			retryBtn: 'Eseye verifye ankò',
			contactSupport: 'Kontakte sipò a',
			paymentConfirmed: 'Peman Konfime',
			thanksOrder: 'Mèsi pou kòmand ou an !',
			txConfirmed: 'Tranzaksyon ou an konfime avèk siksè.',
			emailSentSuccess: 'Yon imèl aksè voye bay',
			emailSentFail: 'Achte w la disponib nan kont ou; imèl la pa t ka voye pou kounye a.',
			typeCourse: 'Fòmasyon sou entènèt',
			typeEbook: 'E-book PDF',
			typeBundle: 'Bundle',
			typeCoaching: 'Sesyon Coaching',
			customerLabel: 'Kliyan :',
			amountPaidLabel: 'Montan peye',
			receiptTitle: 'Detay resi an',
			statusLabel: 'Sitiyasyon peman an',
			statusValid: 'Valab',
			providerLabel: 'Mwayen peman',
			dateLabel: 'Dat tranzaksyon an',
			paymentIdLabel: 'ID Peman',
			accessCourseNow: 'Jwenn aksè nan fòmasyon an kounye a',
			viewDownloadEbook: 'Gade & Telechaje E-book la',
			viewMyResources: 'Gade resous mwen yo',
			viewBookingDetails: 'Gade detay rendez-vous an',
			viewTransactions: 'Gade tout tranzaksyon m yo',
			printReceipt: 'Enprime resi an',
			questionOrder: 'Ou gen yon kesyon sou kòmand ou an ?',
			supportWhatsapp: 'Sipò WhatsApp Coaching',
			contactPage: 'Paj Kontakte n'
		}
	};

	let t = $derived(i18n[currentLang]);

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
			error = i18n[currentLang].missingOrderId;
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
				error = data.message || i18n[currentLang].paymentPending;
			}
		} catch {
			error = i18n[currentLang].networkError;
		} finally {
			loading = false;
		}
	}

	function printReceipt() {
		window.print();
	}
</script>

<svelte:head>
	<title>{t.title}</title>
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
					<h1 class="text-xl sm:text-2xl font-bold text-base-content">{t.verifyingTitle}</h1>
					<p class="text-xs sm:text-sm text-base-content/60 max-w-md mx-auto">
						{t.verifyingDesc}
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
					<h1 class="text-2xl font-bold text-base-content">{t.errorTitle}</h1>
					<p class="text-sm text-base-content/60 max-w-md mx-auto">{error}</p>
				</div>
				<div class="pt-4 flex flex-wrap items-center justify-center gap-3">
					<a href={getHref('/dashboard')} class="btn btn-primary btn-sm rounded-xl font-bold px-6 gap-2">
						<LayoutDashboard size={16} />
						{t.goToDashboard}
					</a>
					<button type="button" class="btn btn-outline btn-sm rounded-xl font-bold px-6" onclick={verifyPayment}>
						{t.retryBtn}
					</button>
					<a href={getHref('/contact')} class="btn btn-ghost btn-sm rounded-xl font-bold px-6 border border-base-300">
						{t.contactSupport}
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
							<ShieldCheck size={14} /> {t.paymentConfirmed}
						</div>
						<h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight">{t.thanksOrder}</h1>
						<p class="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
							{t.txConfirmed}
							{#if emailSent === true} {t.emailSentSuccess} <strong class="text-white">{order.customerEmail}</strong>.{:else if emailSent === false} {t.emailSentFail}{/if}
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
									{order.productType === 'course' ? t.typeCourse : order.productType === 'ebook' ? t.typeEbook : order.productType === 'bundle' ? t.typeBundle : t.typeCoaching}
								</span>
								<h2 class="text-base sm:text-lg font-bold text-base-content mt-1 line-clamp-1">{order.productTitle}</h2>
								<p class="text-xs text-base-content/50">{t.customerLabel} {order.customerName}</p>
							</div>
						</div>

						<div class="text-right sm:border-l sm:border-base-300 sm:pl-5 shrink-0">
							<span class="text-xs text-base-content/50 block">{t.amountPaidLabel}</span>
							<span class="text-xl font-extrabold text-base-content">{order.amount.toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'ht-HT')} {order.currency || 'HTG'}</span>
						</div>
					</div>

					<!-- Receipt Details Table -->
					<div class="rounded-2xl border border-base-300/70 p-5 space-y-3 bg-base-100 text-xs">
						<div class="flex items-center justify-between border-b border-base-200 pb-3">
							<span class="font-bold text-base-content/70 flex items-center gap-1.5">
								<Receipt size={15} class="text-primary" /> {t.receiptTitle}
							</span>
							<span class="font-mono text-base-content/50"># {order.id}</span>
						</div>

						<div class="grid grid-cols-2 gap-3 pt-1 text-xs">
							<div>
								<span class="text-base-content/50 block">{t.statusLabel}</span>
								<span class="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{t.statusValid} ({order.status})</span>
							</div>
							<div>
								<span class="text-base-content/50 block">{t.providerLabel}</span>
								<span class="font-bold text-base-content uppercase">{order.paymentProvider || 'MonCash'}</span>
							</div>
							<div>
								<span class="text-base-content/50 block">{t.dateLabel}</span>
								<span class="font-medium text-base-content">
									{new Date(order.paidAt || order.createdAt).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'ht-HT', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</span>
							</div>
							<div>
								<span class="text-base-content/50 block">{t.paymentIdLabel}</span>
								<span class="font-mono font-semibold text-base-content truncate block max-w-[180px]">{order.paymentId || order.id}</span>
							</div>
						</div>
					</div>

					<!-- Primary CTA Actions -->
					<div class="space-y-3 pt-2 print:hidden">
						{#if order.productType === 'course'}
							<a
								href={getHref(`/learn/${order.productId}`)}
								class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>{t.accessCourseNow}</span>
								<ArrowRight size={18} />
							</a>
						{:else if order.productType === 'ebook'}
							<a
								href={getHref(`/ebooks/${order.productId}`)}
								class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>{t.viewDownloadEbook}</span>
								<ArrowRight size={18} />
							</a>
						{:else if order.productType === 'bundle'}
							<a href={getHref('/dashboard')} class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2">{t.viewMyResources} <ArrowRight size={18} /></a>
						{:else}
							<a
								href={getHref(`/booking/${order.productId}/success`)}
								class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>{t.viewBookingDetails}</span>
								<ArrowRight size={18} />
							</a>
						{/if}

						<div class="flex flex-col sm:flex-row items-center gap-3">
							<a
								href={getHref('/transactions')}
								class="btn btn-outline min-h-10 flex-1 w-full rounded-xl text-xs font-semibold gap-1.5"
							>
								<Receipt size={15} /> {t.viewTransactions}
							</a>

							<button
								type="button"
								onclick={printReceipt}
								class="btn btn-ghost min-h-10 rounded-xl text-xs font-semibold gap-1.5 border border-base-300"
							>
								<Printer size={15} /> {t.printReceipt}
							</button>
						</div>
					</div>

					<!-- Assistance Footer -->
					<div class="text-center pt-4 border-t border-base-200 text-xs text-base-content/60 print:hidden flex items-center justify-between">
						<span>{t.questionOrder}</span>
						{#if order.productType === 'coaching'}
							<a
								href="https://wa.me/50937001234?text=Bonjou,%20mwen%20gen%20yon%20kesyon%20sou%20rez%C3%A8vasyon%20coaching%20mwen%20an"
								target="_blank"
								rel="noreferrer"
								class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
							>
								<MessageSquare size={14} /> {t.supportWhatsapp}
							</a>
						{:else}
							<a
								href={getHref('/contact')}
								class="text-primary font-bold hover:underline inline-flex items-center gap-1"
							>
								{t.contactPage}
							</a>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
