import type { Ebook } from '$lib/types/admin';

export const initialAdminEbooks: Ebook[] = [
	{
		id: 'ebk-1',
		title: 'Guide Instagram 2026',
		description: 'Découvrez toutes les méthodes pour développer votre audience et convertir vos abonnés en clients fidèles.',
		cover: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80',
		fileName: 'guide-instagram-2026.pdf',
		price: 750,
		isFree: false,
		published: true,
		salesCount: 48,
		createdAt: '2026-01-15'
	},
	{
		id: 'ebk-2',
		title: 'Démarrer son business',
		description: 'Le plan étape par étape pour structurer et lancer votre activité indépendante en toute sérénité.',
		cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
		fileName: 'demarrer-son-business.pdf',
		price: 1000,
		isFree: false,
		published: true,
		salesCount: 112,
		createdAt: '2026-01-20'
	},
	{
		id: 'ebk-3',
		title: 'Guide Canva',
		description: 'Créez des visuels époustouflants pour vos réseaux sociaux sans aucune expérience préalable en graphisme.',
		cover: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80',
		fileName: 'guide-canva.pdf',
		price: 0,
		isFree: true,
		published: true,
		salesCount: 230,
		createdAt: '2026-02-01'
	},
	{
		id: 'ebk-4',
		title: 'Facebook Ads débutant',
		description: 'Apprenez à paramétrer vos premières publicités ciblées et rentables sur Facebook & Instagram.',
		cover: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80',
		fileName: 'facebook-ads-debutant.pdf',
		price: 500,
		isFree: false,
		published: false,
		salesCount: 0,
		createdAt: '2026-02-10'
	},
	{
		id: 'ebk-5',
		title: 'Vendre en ligne',
		description: 'Les clés indispensables pour créer une boutique en ligne et maximiser le taux de conversion.',
		cover: 'https://images.unsplash.com/photo-1556742049-0a670fc8077a?w=400&q=80',
		fileName: 'vendre-en-ligne.pdf',
		price: 1250,
		isFree: false,
		published: true,
		salesCount: 85,
		createdAt: '2026-02-14'
	},
	// Additional mock ebooks for 20 per page pagination
	...Array.from({ length: 25 }, (_, i) => {
		const idx = i + 6;
		const isFree = idx % 4 === 0;
		const price = isFree ? 0 : 450 + (idx * 50);
		const published = idx % 3 !== 0;
		const titleSample = [
			'Stratégie TikTok 2026',
			'Secrets de Copywriting',
			'Branding pour Artistes',
			'Home Studio Pro',
			'Scratch & DJing Book',
			'Comptabilité Freelance'
		];
		const sampleTitle = titleSample[i % titleSample.length];

		return {
			id: `ebk-${idx}`,
			title: `${sampleTitle} Vol. ${Math.floor(i / 6) + 1}`,
			description: `Ebook complet et pratique sur ${sampleTitle.toLowerCase()}. Des fiches synthétiques et cas réels.`,
			cover: `https://images.unsplash.com/photo-${1500000000000 + (i * 25000)}?w=400&q=80`,
			fileName: `${sampleTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
			price,
			isFree,
			published,
			salesCount: (i * 13 + 7) % 180,
			createdAt: `2026-02-${(i % 20) + 1}`
		};
	})
];
