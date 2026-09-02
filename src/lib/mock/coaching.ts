import type { Booking, CoachingService, CoachingSettings, CoachingSlot } from '$lib/types/coaching';

export const mockCoachingSettings: CoachingSettings = {
	id: 'settings-admin-001', userId: 'admin-001', country: 'HT', timezone: 'America/Port-au-Prince',
	whatsapp: '+50937001234', createdAt: '2026-08-01T13:00:00.000Z', updatedAt: '2026-08-28T13:00:00.000Z'
};

export const mockCoachingServices: CoachingService[] = [
	{
		id: 'business-strategy', ownerId: 'admin-001', title: 'Coaching Business', slug: 'coaching-business',
		description: 'Une session individuelle pour clarifier votre stratégie, débloquer vos priorités et repartir avec un plan d’action concret.',
		price: 3000, currency: 'HTG', isFree: false, durationMinutes: 60, active: true,
		createdAt: '2026-08-05T14:00:00.000Z', updatedAt: '2026-08-27T14:00:00.000Z'
	},
	{
		id: 'brand-audit', ownerId: 'admin-001', title: 'Audit express de marque', slug: 'audit-express-marque',
		description: 'Un regard rapide et structuré sur votre positionnement et votre présence en ligne.',
		price: 0, currency: 'HTG', isFree: true, durationMinutes: 30, active: true,
		createdAt: '2026-08-10T14:00:00.000Z', updatedAt: '2026-08-26T14:00:00.000Z'
	}
];

export const mockCoachingSlots: CoachingSlot[] = [
	{ id: 'slot-001', serviceId: 'business-strategy', startAt: '2026-08-29T18:00:00.000Z', endAt: '2026-08-29T19:00:00.000Z', coachTimezone: 'America/Port-au-Prince', status: 'available', createdAt: '2026-08-20T12:00:00.000Z' },
	{ id: 'slot-002', serviceId: 'business-strategy', startAt: '2026-08-30T14:30:00.000Z', endAt: '2026-08-30T15:30:00.000Z', coachTimezone: 'America/Port-au-Prince', status: 'available', createdAt: '2026-08-20T12:00:00.000Z' },
	{ id: 'slot-003', serviceId: 'business-strategy', startAt: '2026-09-02T20:00:00.000Z', endAt: '2026-09-02T21:00:00.000Z', coachTimezone: 'America/Port-au-Prince', status: 'booked', createdAt: '2026-08-20T12:00:00.000Z' },
	{ id: 'slot-004', serviceId: 'business-strategy', startAt: '2026-09-04T17:00:00.000Z', endAt: '2026-09-04T18:00:00.000Z', coachTimezone: 'America/Port-au-Prince', status: 'available', createdAt: '2026-08-22T12:00:00.000Z' }
];

export const mockBookings: Booking[] = [
	{ id: 'booking-001', serviceId: 'business-strategy', slotId: 'slot-003', userId: null, customerName: 'Jean Pierre', customerEmail: 'jean.pierre@example.com', customerWhatsapp: '+50938112233', customerTimezone: 'America/Port-au-Prince', coachTimezone: 'America/Port-au-Prince', startAt: '2026-09-02T20:00:00.000Z', endAt: '2026-09-02T21:00:00.000Z', amount: 3000, currency: 'HTG', status: 'confirmed', paymentId: 'payment-001', paymentStatus: 'paid', holdExpiresAt: null, createdAt: '2026-08-27T15:30:00.000Z', updatedAt: '2026-08-27T15:35:00.000Z' },
	{ id: 'booking-002', serviceId: 'business-strategy', slotId: 'slot-005', userId: null, customerName: 'Marie Louis', customerEmail: 'marie.louis@example.com', customerWhatsapp: '+50940001122', customerTimezone: 'America/New_York', coachTimezone: 'America/Port-au-Prince', startAt: '2026-09-05T15:00:00.000Z', endAt: '2026-09-05T16:00:00.000Z', amount: 3000, currency: 'HTG', status: 'pending_payment', paymentId: 'payment-002', paymentStatus: 'pending', holdExpiresAt: '2026-08-28T20:30:00.000Z', createdAt: '2026-08-28T20:20:00.000Z', updatedAt: '2026-08-28T20:20:00.000Z' },
	{ id: 'booking-003', serviceId: 'brand-audit', slotId: 'slot-006', userId: null, customerName: 'David Charles', customerEmail: 'david.charles@example.com', customerWhatsapp: '+18095550123', customerTimezone: 'America/Santo_Domingo', coachTimezone: 'America/Port-au-Prince', startAt: '2026-09-08T18:00:00.000Z', endAt: '2026-09-08T18:30:00.000Z', amount: 0, currency: 'HTG', status: 'completed', paymentId: null, paymentStatus: 'not_required', holdExpiresAt: null, createdAt: '2026-08-21T14:00:00.000Z', updatedAt: '2026-08-25T18:35:00.000Z' }
];
