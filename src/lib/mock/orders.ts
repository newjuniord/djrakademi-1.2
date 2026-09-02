import type { Order } from '$lib/types/admin';

export const initialAdminOrders: Order[] = [
	{
		id: 'ord-1024',
		reference: 'ORD-1024',
		userId: 'usr-1',
		customerName: 'Jean Pierre',
		customerEmail: 'jean@example.com',
		customerPhone: '+509 3712 4589',
		productId: 'crs-1',
		productTitle: 'Marketing Digital pour Créateurs',
		type: 'course',
		amount: 2500,
		currency: 'HTG',
		status: 'paid',
		paymentId: 'TXN-984210',
		paymentProvider: 'MonCash',
		createdAt: '2026-08-28T14:32:00Z',
		paidAt: '2026-08-28T14:33:15Z'
	},
	{
		id: 'ord-1025',
		reference: 'ORD-1025',
		userId: 'usr-2',
		customerName: 'Marie Carmel',
		customerEmail: 'marie@example.com',
		customerPhone: '+509 4812 9012',
		productId: 'ebk-1',
		productTitle: 'Guide Instagram 2026',
		type: 'ebook',
		amount: 750,
		currency: 'HTG',
		status: 'paid',
		paymentId: 'TXN-984211',
		paymentProvider: 'Natcash',
		createdAt: '2026-08-28T12:15:00Z',
		paidAt: '2026-08-28T12:16:05Z'
	},
	{
		id: 'ord-1026',
		reference: 'ORD-1026',
		userId: 'usr-3',
		customerName: 'Fabrice Joseph',
		customerEmail: 'fabrice@example.com',
		customerPhone: '+509 3145 8890',
		productId: 'chg-1',
		productTitle: 'Session Coaching Strategy DJ (1h)',
		type: 'coaching',
		amount: 5000,
		currency: 'HTG',
		status: 'pending',
		paymentProvider: 'MonCash',
		createdAt: '2026-08-28T11:00:00Z'
	},
	{
		id: 'ord-1027',
		reference: 'ORD-1027',
		userId: 'usr-4',
		customerName: 'Esther Louis',
		customerEmail: 'esther@example.com',
		customerPhone: '+509 4233 1109',
		productId: 'ebk-2',
		productTitle: 'Démarrer son business',
		type: 'ebook',
		amount: 1000,
		currency: 'HTG',
		status: 'failed',
		paymentProvider: 'Stripe',
		createdAt: '2026-08-27T18:45:00Z'
	},
	{
		id: 'ord-1028',
		reference: 'ORD-1028',
		userId: 'usr-5',
		customerName: 'Alexandre Charles',
		customerEmail: 'alexandre@example.com',
		customerPhone: '+509 3890 2341',
		productId: 'crs-2',
		productTitle: 'Facebook Ads & Instagram Ads Masterclass',
		type: 'course',
		amount: 3500,
		currency: 'HTG',
		status: 'paid',
		paymentId: 'TXN-984212',
		paymentProvider: 'MonCash',
		createdAt: '2026-08-27T16:20:00Z',
		paidAt: '2026-08-27T16:21:40Z'
	},
	{
		id: 'ord-1029',
		reference: 'ORD-1029',
		userId: 'usr-6',
		customerName: 'Nathalie Baptist',
		customerEmail: 'nathalie@example.com',
		customerPhone: '+509 4910 3388',
		productId: 'crs-3',
		productTitle: 'Production & Mixage Audio DJ',
		type: 'course',
		amount: 5000,
		currency: 'HTG',
		status: 'expired',
		paymentProvider: 'Natcash',
		createdAt: '2026-08-26T09:10:00Z'
	},
	{
		id: 'ord-1030',
		reference: 'ORD-1030',
		userId: 'usr-7',
		customerName: 'Kervens Moïse',
		customerEmail: 'kervens@example.com',
		customerPhone: '+509 3671 0092',
		productId: 'ebk-5',
		productTitle: 'Vendre en ligne',
		type: 'ebook',
		amount: 1250,
		currency: 'HTG',
		status: 'paid',
		paymentId: 'TXN-984213',
		paymentProvider: 'MonCash',
		createdAt: '2026-08-26T08:00:00Z',
		paidAt: '2026-08-26T08:01:20Z'
	},
	{
		id: 'ord-1031',
		reference: 'ORD-1031',
		userId: 'usr-8',
		customerName: 'Woodley Alexis',
		customerEmail: 'woodley@example.com',
		customerPhone: '+509 3512 7744',
		productId: 'chg-2',
		productTitle: 'Audit & Mixage Studio VIP',
		type: 'coaching',
		amount: 7500,
		currency: 'HTG',
		status: 'paid',
		paymentId: 'TXN-984214',
		paymentProvider: 'Natcash',
		createdAt: '2026-08-25T15:30:00Z',
		paidAt: '2026-08-25T15:31:00Z'
	},
	{
		id: 'ord-1032',
		reference: 'ORD-1032',
		userId: 'usr-9',
		customerName: 'Sabrina Noel',
		customerEmail: 'sabrina@example.com',
		productId: 'ebk-4',
		productTitle: 'Facebook Ads débutant',
		type: 'ebook',
		amount: 500,
		currency: 'HTG',
		status: 'pending',
		paymentProvider: 'MonCash',
		createdAt: '2026-08-25T11:12:00Z'
	},
	{
		id: 'ord-1033',
		reference: 'ORD-1033',
		userId: 'usr-10',
		customerName: 'Guillaume Blanc',
		customerEmail: 'guillaume@example.com',
		productId: 'crs-1',
		productTitle: 'Marketing Digital pour Créateurs',
		type: 'course',
		amount: 2500,
		currency: 'HTG',
		status: 'paid',
		paymentId: 'TXN-984215',
		paymentProvider: 'Stripe',
		createdAt: '2026-08-24T17:40:00Z',
		paidAt: '2026-08-24T17:41:00Z'
	},
	// Additional mock orders for 20 per page pagination
	...Array.from({ length: 25 }, (_, i) => {
		const num = 1034 + i;
		const types: ('course' | 'ebook' | 'coaching')[] = ['course', 'ebook', 'coaching'];
		const statuses: ('paid' | 'pending' | 'failed' | 'expired')[] = ['paid', 'paid', 'paid', 'pending', 'failed', 'expired'];
		const providers = ['MonCash', 'Natcash', 'Stripe'];
		const sampleNames = ['Patrick Toussaint', 'Lourdes François', 'Rodney Germain', 'Vanessa Célestin', 'Junior Antoine', 'Daphnée Hyppolite'];
		const sampleProducts = [
			'Techniques Avancées de Scratch DJ',
			'Branding & Identité Visuelle',
			'Stratégie de Contenu TikTok',
			'Monétiser sa Musique en Ligne',
			'Setup Studio & Home Recording'
		];

		const type = types[i % types.length];
		const status = statuses[i % statuses.length];
		const name = sampleNames[i % sampleNames.length];
		const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}${num}@example.com`;
		const productTitle = sampleProducts[i % sampleProducts.length];
		const amount = type === 'coaching' ? 5000 : type === 'course' ? 2500 : 750;
		const provider = providers[i % providers.length];

		return {
			id: `ord-${num}`,
			reference: `ORD-${num}`,
			userId: `usr-${i + 11}`,
			customerName: name,
			customerEmail: email,
			customerPhone: `+509 37${i + 10} ${num}`,
			productId: `prd-${num}`,
			productTitle,
			type,
			amount,
			currency: 'HTG' as const,
			status,
			paymentId: status === 'paid' ? `TXN-${984216 + i}` : undefined,
			paymentProvider: provider,
			createdAt: `2026-08-${Math.max(1, 24 - Math.floor(i / 3))}T10:00:00Z`,
			paidAt: status === 'paid' ? `2026-08-${Math.max(1, 24 - Math.floor(i / 3))}T10:02:00Z` : undefined
		};
	})
];
