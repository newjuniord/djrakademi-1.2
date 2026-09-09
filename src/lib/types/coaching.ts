export type SlotStatus = 'available' | 'held' | 'booked' | 'cancelled';
export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export type CoachingDuration = 30 | 45 | 60 | 90;

export interface CoachingSettings {
	id: string;
	userId: string;
	country: string;
	timezone: string;
	whatsapp: string;
	workingDays: number[];
	workStart: string;
	workEnd: string;
	breakDuration: number;
	noticeHours: number;
	maxAdvanceDays: number;
	createdAt: string;
	updatedAt: string;
}

export interface CoachingUnavailability {
	id: string;
	serviceId: string | null;
	startAt: string;
	endAt: string;
	reason: string;
}

export interface CoachingService {
	id: string;
	ownerId: string;
	title: string;
	slug: string;
	description: string;
	price: number;
	priceUsd?: number;
	currency: 'HTG';
	isFree: boolean;
	durationMinutes: CoachingDuration;
	active: boolean;
	variantId?: string;
	lemonsqueezyVariantId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CoachingSlot {
	id: string;
	serviceId: string;
	startAt: string;
	endAt: string;
	coachTimezone: string;
	status: SlotStatus;
	createdAt: string;
}

export interface Booking {
	id: string;
	serviceId: string;
	userId: string | null;
	customerName: string;
	customerEmail: string;
	customerWhatsapp: string;
	customerTimezone: string;
	coachTimezone: string;
	startAt: string;
	endAt: string;
	amount: number;
	currency: 'HTG';
	status: BookingStatus;
	paymentId: string | null;
	paymentStatus: PaymentStatus | 'not_required';
	holdExpiresAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Payment {
	id: string;
	bookingId: string;
	provider: string;
	providerTransactionId: string;
	amount: number;
	currency: 'HTG';
	status: PaymentStatus;
	createdAt: string;
	updatedAt: string;
	paidAt: string | null;
	lastCheckedAt: string | null;
}

export interface TimezoneOption {
	value: string;
	label: string;
	city: string;
}

export interface CoachingFormValue {
	title: string;
	slug: string;
	description: string;
	price: number;
	priceUsd?: number;
	isFree: boolean;
	durationMinutes: CoachingDuration;
	active: boolean;
	variantId?: string;
	lemonsqueezyVariantId?: string;
}

export interface BookingCustomerInput {
	name: string;
	email: string;
	whatsapp: string;
	timezone: string;
}
