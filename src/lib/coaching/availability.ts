import type { CoachingService, CoachingSettings, CoachingSlot, CoachingUnavailability } from '$lib/types/coaching';

export type AvailabilityBooking = {
	startAt: string;
	endAt: string;
	status: string;
	holdExpiresAt?: string | null;
};

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function dateParts(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
	}).formatToParts(date);
	const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
	return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
}

export function zonedDateTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
	const wanted = Date.UTC(year, month - 1, day, hour, minute);
	let guess = wanted;
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const actual = dateParts(new Date(guess), timeZone);
		const rendered = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
		const next = guess + wanted - rendered;
		if (next === guess) break;
		guess = next;
	}
	return new Date(guess);
}

function parseClock(value: string, fallback: string): number {
	const clock = timePattern.test(value) ? value : fallback;
	const [hours, minutes] = clock.split(':').map(Number);
	return hours * 60 + minutes;
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
	return startA < endB && endA > startB;
}

export function normalizeAvailabilitySettings(settings: Partial<CoachingSettings>): Pick<CoachingSettings, 'workingDays' | 'workStart' | 'workEnd' | 'breakDuration' | 'noticeHours' | 'maxAdvanceDays' | 'timezone'> {
	const days = Array.isArray(settings.workingDays)
		? [...new Set(settings.workingDays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
		: [1, 2, 3, 4, 5];
	return {
		workingDays: days.length ? days : [1, 2, 3, 4, 5],
		workStart: timePattern.test(settings.workStart || '') ? settings.workStart! : '09:00',
		workEnd: timePattern.test(settings.workEnd || '') ? settings.workEnd! : '17:00',
		breakDuration: Math.max(0, Math.min(240, Number(settings.breakDuration ?? 0))),
		noticeHours: Math.max(0, Math.min(720, Number(settings.noticeHours ?? 24))),
		maxAdvanceDays: Math.max(1, Math.min(365, Number(settings.maxAdvanceDays ?? 90))),
		timezone: settings.timezone || 'America/Port-au-Prince'
	};
}

export function generateDynamicSlots(
	service: Pick<CoachingService, 'id' | 'durationMinutes'>,
	settingsInput: CoachingSettings,
	existingBookings: AvailabilityBooking[],
	unavailability: CoachingUnavailability[] = [],
	options: { now?: Date; days?: number } = {}
): CoachingSlot[] {
	const settings = normalizeAvailabilitySettings(settingsInput);
	const now = options.now || new Date();
	const earliest = now.getTime() + settings.noticeHours * 3_600_000;
	const requestedDays = Math.max(1, Math.min(options.days || 30, settings.maxAdvanceDays));
	const latest = now.getTime() + requestedDays * 86_400_000;
	const duration = Math.max(1, Number(service.durationMinutes) || 60);
	const step = duration + settings.breakDuration;
	const workStart = parseClock(settings.workStart, '09:00');
	const workEnd = parseClock(settings.workEnd, '17:00');
	if (workEnd <= workStart) return [];

	const unavailableRanges = unavailability.map((item) => [Date.parse(item.startAt), Date.parse(item.endAt)] as const)
		.filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start);
	const busyRanges = existingBookings
		.filter((booking) => {
			if (booking.status === 'confirmed') return true;
			if (booking.status === 'pending_payment') {
				if (!booking.holdExpiresAt) return false;
				const exp = Date.parse(booking.holdExpiresAt);
				return Number.isFinite(exp) && exp > now.getTime();
			}
			return false;
		})
		.map((booking) => [Date.parse(booking.startAt), Date.parse(booking.endAt)] as const)
		.filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start);

	const today = dateParts(now, settings.timezone);
	const localNoon = zonedDateTimeToUtc(today.year, today.month, today.day, 12, 0, settings.timezone);
	const slots: CoachingSlot[] = [];
	for (let offset = 0; offset <= requestedDays; offset += 1) {
		const dayProbe = new Date(localNoon.getTime() + offset * 86_400_000);
		const local = dateParts(dayProbe, settings.timezone);
		const weekday = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay();
		if (!settings.workingDays.includes(weekday)) continue;
		for (let minute = workStart; minute + duration <= workEnd; minute += step) {
			const start = zonedDateTimeToUtc(local.year, local.month, local.day, Math.floor(minute / 60), minute % 60, settings.timezone);
			const end = new Date(start.getTime() + duration * 60_000);
			if (start.getTime() < earliest || start.getTime() > latest) continue;
			if (busyRanges.some(([busyStart, busyEnd]) => overlaps(start.getTime(), end.getTime(), busyStart, busyEnd))) continue;
			if (unavailableRanges.some(([offStart, offEnd]) => overlaps(start.getTime(), end.getTime(), offStart, offEnd))) continue;
			slots.push({
				id: `${service.id}:${start.toISOString()}`,
				serviceId: service.id,
				startAt: start.toISOString(), endAt: end.toISOString(), coachTimezone: settings.timezone,
				status: 'available', createdAt: now.toISOString()
			});
		}
	}
	return slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
}
