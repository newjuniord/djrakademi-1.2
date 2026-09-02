import type {
	AdminStat,
	AdminUser,
	UserStatus,
	Course,
	QuickAction,
	RecentOrder,
	RecentUser,
	RevenueItem,
	UpcomingBooking
} from '$lib/types/admin';

export const adminStats: AdminStat[] = [
	{ label: 'Revenu net', value: '48 500 HTG', detail: '+12,5 % ce mois', icon: 'revenue' },
	{ label: 'Ventes', value: '127', detail: '32 ce mois', icon: 'sales' },
	{ label: 'Utilisateurs', value: '486', detail: '18 nouveaux ce mois', icon: 'users' },
	{ label: 'Réservations', value: '24', detail: '6 à venir', icon: 'bookings' }
];

export const revenueSummary: RevenueItem[] = [
	{ label: 'Revenu brut', value: '52 000 HTG' },
	{ label: 'Frais de paiement', value: '3 500 HTG' },
	{ label: 'Revenu net', value: '48 500 HTG', emphasis: true }
];

export const recentOrders: RecentOrder[] = [
	{ id: 'order-001', client: 'Jean Pierre', product: 'Marketing Digital', type: 'Cours', amount: '2 500 HTG', status: 'Payé', date: 'Aujourd’hui' },
	{ id: 'order-002', client: 'Marie Louis', product: 'Guide Instagram', type: 'Ebook', amount: '750 HTG', status: 'Payé', date: 'Aujourd’hui' },
	{ id: 'order-003', client: 'David Charles', product: 'Session Business', type: 'Coaching', amount: '3 000 HTG', status: 'Payé', date: 'Hier' }
];

export const upcomingBookings: UpcomingBooking[] = [
	{ id: 'booking-001', client: 'Jean Pierre', coaching: 'Coaching Business', date: '29 août 2026', time: '14:00' },
	{ id: 'booking-002', client: 'Sophie Michel', coaching: 'Stratégie de marque', date: '30 août 2026', time: '10:30' },
	{ id: 'booking-003', client: 'David Charles', coaching: 'Session Business', date: '2 sept. 2026', time: '16:00' }
];

export const recentUsers: RecentUser[] = [
	{ id: 'user-001', name: 'Nadia Joseph', email: 'nadia.joseph@example.com', joinedAt: 'Aujourd’hui', initials: 'NJ' },
	{ id: 'user-002', name: 'Marc Antoine', email: 'marc.antoine@example.com', joinedAt: 'Aujourd’hui', initials: 'MA' },
	{ id: 'user-003', name: 'Sophie Michel', email: 'sophie.michel@example.com', joinedAt: 'Hier', initials: 'SM' },
	{ id: 'user-004', name: 'Luc Bernard', email: 'luc.bernard@example.com', joinedAt: '26 août 2026', initials: 'LB' }
];

export const quickActions: QuickAction[] = [
	{ label: 'Nouveau cours', href: '/admin/courses/new' },
	{ label: 'Nouvel ebook', href: '/admin/ebooks/new' },
	{ label: 'Nouveau coaching', href: '/admin/coaching/new' },
	{ label: 'Ajouter un utilisateur', href: '/admin/users' }
];

const sampleFirstNames = [
	'Jean', 'Marie', 'David', 'Sophie', 'Luc', 'Nadia', 'Marc', 'Claire',
	'Alexandre', 'Emilie', 'Thomas', 'Camille', 'Antoine', 'Léa', 'Nicolas', 'Julie',
	'Julien', 'Sarah', 'Paul', 'Elodie', 'Gabriel', 'Charlotte', 'Hugo', 'Manon'
];

const sampleLastNames = [
	'Pierre', 'Louis', 'Charles', 'Michel', 'Bernard', 'Joseph', 'Antoine', 'Denis',
	'Moreau', 'Fournier', 'Roux', 'Girard', 'Vincent', 'Lefebvre', 'Mercier', 'Blanc',
	'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Garcia'
];

export const initialAdminUsers: AdminUser[] = Array.from({ length: 75 }, (_, i) => {
	const firstName = sampleFirstNames[i % sampleFirstNames.length];
	const lastName = sampleLastNames[(i * 3) % sampleLastNames.length];
	const name = `${firstName} ${lastName}`;
	const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 24 ? i : ''}@example.com`;
	const status: UserStatus = i % 7 === 3 ? 'disabled' : 'active';
	const courseCount = (i * 2 + 1) % 5;
	const ebookCount = (i + 3) % 4;
	const day = 28 - (i % 28);
	const month = i > 40 ? 'juil.' : 'août';
	const createdAt = `${day} ${month} 2026`;

	return {
		id: `usr-${i + 1}`,
		name,
		email,
		status,
		courseCount,
		ebookCount,
		createdAt
	};
});

const sampleCourseTitles = [
	'Marketing Digital pour Créateurs',
	'Facebook Ads & Instagram Ads Masterclass',
	'Canva pour Débutants',
	'Production & Mixage Audio DJ',
	'Techniques Avancées de Scratch DJ',
	'Branding & Identité Visuelle',
	'Stratégie de Contenu TikTok',
	'Monétiser sa Musique en Ligne',
	'Setup Studio & Home Recording',
	'Storytelling & Prise de Parole',
	'E-commerce & Dropshipping',
	'Design Graphique avec Photoshop',
	'Copywriting & Rédaction Persuasive',
	'Gestion Financière pour Freelances',
	'SEO & Référencement Naturel'
];

export const initialAdminCourses: Course[] = Array.from({ length: 35 }, (_, i) => {
	const baseTitle = sampleCourseTitles[i % sampleCourseTitles.length];
	const title = i < 15 ? baseTitle : `${baseTitle} (Niveau ${Math.floor(i / 15) + 1})`;
	const isFree = i % 5 === 2;
	const price = isFree ? 0 : 1500 + (i % 6) * 500;
	const published = i % 4 !== 3;
	const studentCount = (i * 17 + 12) % 250;

	return {
		id: `crs-${i + 1}`,
		title,
		description: `Formation complète sur ${title.toLowerCase()}. Apprenez les meilleures stratégies et cas pratiques.`,
		cover: `https://images.unsplash.com/photo-${1460925895917 + (i * 1000)}?w=400&q=80`,
		price,
		isFree,
		published,
		studentCount,
		modules: [
			{
				id: `mod-${i + 1}-1`,
				title: 'Module 1 — Introduction et Fondamentaux',
				lessons: [
					{
						id: `les-${i + 1}-1`,
						title: 'Bienvenue dans ce cours',
						type: 'video',
						videoUrl: 'https://vimeo.com/76979871'
					},
					{
						id: `les-${i + 1}-2`,
						title: 'Guide de démarrage rapide',
						type: 'text',
						content: 'Voici les étapes indispensables pour réussir cette formation...'
					}
				]
			},
			{
				id: `mod-${i + 1}-2`,
				title: 'Module 2 — Mettre en pratique',
				lessons: [
					{
						id: `les-${i + 1}-3`,
						title: 'Exercice guidé et étude de cas',
						type: 'video',
						videoUrl: 'https://vimeo.com/76979872'
					}
				]
			}
		]
	};
});




