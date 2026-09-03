export type StatIcon = 'revenue' | 'sales' | 'users' | 'bookings';

export interface AdminStat {
	label: string;
	value: string;
	detail: string;
	icon: StatIcon;
}

export interface RevenueItem {
	label: string;
	value: string;
	emphasis?: boolean;
}

export type ProductType = 'Cours' | 'Ebook' | 'Coaching';

export interface RecentOrder {
	id: string;
	client: string;
	product: string;
	type: ProductType;
	amount: string;
	status: 'Payé' | 'En attente' | 'Échoué' | 'Expiré';
	date: string;
}

export interface UpcomingBooking {
	id: string;
	client: string;
	coaching: string;
	date: string;
	time: string;
}

export interface RecentUser {
	id: string;
	name: string;
	email: string;
	joinedAt: string;
	initials: string;
}

export interface QuickAction {
	label: string;
	href: string;
}

export type UserStatus = 'active' | 'disabled';

export type AdminUser = {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	status: UserStatus;
	courseCount: number;
	ebookCount: number;
	createdAt: string;
};

export type LessonType = 'video' | 'text';

export type Lesson = {
	id: string;
	title: string;
	type: LessonType;
	videoUrl?: string;
	content?: string;
};

export type CourseModule = {
	id: string;
	title: string;
	lessons: Lesson[];
};

export type Course = {
	id: string;
	title: string;
	description: string;
	cover?: string;
	price: number;
	isFree: boolean;
	published: boolean;
	studentCount: number;
	variantId?: string;
	lemonsqueezyVariantId?: string;
	modules: CourseModule[];
	progress?: { completedLessonIds: string[]; lastLessonId?: string };
};

export type Ebook = {
	id: string;
	title: string;
	description: string;
	cover?: string;
	coverFileId?: string;
	pdfFileId?: string;
	pdfUrl?: string;
	fileName?: string;
	price: number;
	isFree: boolean;
	published: boolean;
	salesCount: number;
	variantId?: string;
	lemonsqueezyVariantId?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type OrderType = 'course' | 'ebook' | 'coaching';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';

export type Order = {
	id: string;
	reference: string;
	userId?: string;
	customerName: string;
	customerEmail: string;
	customerPhone?: string;
	productId: string;
	productTitle: string;
	type: OrderType;
	amount: number;
	currency: 'HTG';
	status: OrderStatus;
	paymentId?: string;
	paymentProvider?: string;
	createdAt: string;
	paidAt?: string;
	accessGranted?: boolean;
};

export type ApiLogLevel = 'info' | 'warn' | 'error';
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiLogEntry = {
	id: string;
	method: ApiMethod;
	endpoint: string;
	statusCode: number;
	statusText: string;
	responseTimeMs: number;
	clientIp: string;
	userAgent: string;
	timestamp: string;
	requestHeaders: Record<string, string>;
	requestPayload?: Record<string, any>;
	responsePayload?: Record<string, any>;
};




