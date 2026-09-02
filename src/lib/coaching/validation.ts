import type { CoachingDuration, CoachingFormValue } from '$lib/types/coaching';
import { isValidTimezone } from './timezone';

const VALID_DURATIONS: CoachingDuration[] = [30, 45, 60, 90];

export function slugify(value: string): string {
	return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeE164(value: string): string {
	const trimmed = value.trim();
	const digits = trimmed.replace(/[^\d+]/g, '');
	return digits.startsWith('+') ? `+${digits.slice(1).replace(/\D/g, '')}` : digits.replace(/\D/g, '');
}

export function isValidE164(value: string): boolean {
	return /^\+[1-9]\d{7,14}$/.test(normalizeE164(value));
}

export function whatsappLink(phone: string, message: string): string {
	return `https://wa.me/${normalizeE164(phone).replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export function validateCoaching(value: CoachingFormValue): string | null {
	if (!value.title.trim()) return 'Le titre est obligatoire.';
	if (!value.slug.trim()) return 'Le slug est obligatoire.';
	if (!VALID_DURATIONS.includes(value.durationMinutes)) return 'La durée sélectionnée est invalide.';
	if (!Number.isFinite(value.price) || value.price < 0) return 'Le prix doit être supérieur ou égal à zéro.';
	return null;
}

export function validateBookingInput(input: { name: string; email: string; whatsapp: string; timezone: string }): string | null {
	if (!input.name.trim()) return 'Votre nom est obligatoire.';
	if (!isValidEmail(input.email)) return 'Adresse email invalide.';
	if (!isValidE164(input.whatsapp)) return 'Numéro WhatsApp invalide.';
	if (!isValidTimezone(input.timezone)) return 'Fuseau horaire invalide.';
	return null;
}
