export interface Course {
	id: string;
	title: string;
	description: string;
	price: number;
	image: string;
}

export interface Ebook {
	id: string;
	title: string;
	description: string;
	price: number;
	cover: string;
}

export interface CoachingOffer {
	id: string;
	title: string;
	description: string;
	durationMinutes: number;
	price: number;
}
