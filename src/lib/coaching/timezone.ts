import type { TimezoneOption } from '$lib/types/coaching';

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
	// 🌎 AMÉRIQUE (Nord, Centre, Sud & Caraïbes)
	{ value: 'America/Port-au-Prince', label: 'Haïti — Port-au-Prince (GMT-5)', city: 'Port-au-Prince' },
	{ value: 'America/Santo_Domingo', label: 'République dominicaine — Saint-Domingue (GMT-4)', city: 'Saint-Domingue' },
	{ value: 'America/Guadeloupe', label: 'Guadeloupe & Martinique — Fort-de-France (GMT-4)', city: 'Guadeloupe' },
	{ value: 'America/Jamaica', label: 'Jamaïque — Kingston (GMT-5)', city: 'Kingston' },
	{ value: 'America/Havana', label: 'Cuba — La Havane (GMT-5)', city: 'La Havane' },
	{ value: 'America/Puerto_Rico', label: 'Porto Rico — San Juan (GMT-4)', city: 'San Juan' },
	{ value: 'America/New_York', label: 'États-Unis (Est) — New York, Miami, Washington (GMT-5)', city: 'New York' },
	{ value: 'America/Chicago', label: 'États-Unis (Centre) — Chicago, Dallas, Houston (GMT-6)', city: 'Chicago' },
	{ value: 'America/Denver', label: 'États-Unis (Montagne) — Denver, Phoenix (GMT-7)', city: 'Denver' },
	{ value: 'America/Los_Angeles', label: 'États-Unis (Pacifique) — Los Angeles, San Francisco (GMT-8)', city: 'Los Angeles' },
	{ value: 'America/Anchorage', label: 'États-Unis (Alaska) — Anchorage (GMT-9)', city: 'Anchorage' },
	{ value: 'Pacific/Honolulu', label: 'États-Unis (Hawaï) — Honolulu (GMT-10)', city: 'Honolulu' },
	{ value: 'America/Toronto', label: 'Canada (Est) — Montréal, Toronto, Ottawa (GMT-5)', city: 'Montréal' },
	{ value: 'America/Vancouver', label: 'Canada (Ouest) — Vancouver, Calgary (GMT-8)', city: 'Vancouver' },
	{ value: 'America/Mexico_City', label: 'Mexique — Mexico, Cancún (GMT-6)', city: 'Mexico' },
	{ value: 'America/Guatemala', label: 'Guatemala (GMT-6)', city: 'Guatemala' },
	{ value: 'America/Costa_Rica', label: 'Costa Rica — San José (GMT-6)', city: 'San José' },
	{ value: 'America/Panama', label: 'Panama (GMT-5)', city: 'Panama' },
	{ value: 'America/Bogota', label: 'Colombie — Bogotá, Medellín (GMT-5)', city: 'Bogotá' },
	{ value: 'America/Caracas', label: 'Venezuela — Caracas (GMT-4)', city: 'Caracas' },
	{ value: 'America/Guayaquil', label: 'Équateur — Quito, Guayaquil (GMT-5)', city: 'Quito' },
	{ value: 'America/Lima', label: 'Pérou — Lima (GMT-5)', city: 'Lima' },
	{ value: 'America/Sao_Paulo', label: 'Brésil — São Paulo, Rio de Janeiro, Brasilia (GMT-3)', city: 'São Paulo' },
	{ value: 'America/Argentina/Buenos_Aires', label: 'Argentine — Buenos Aires (GMT-3)', city: 'Buenos Aires' },
	{ value: 'America/Santiago', label: 'Chili — Santiago (GMT-3)', city: 'Santiago' },
	{ value: 'America/Montevideo', label: 'Uruguay — Montevideo (GMT-3)', city: 'Montevideo' },
	{ value: 'America/La_Paz', label: 'Bolivie — La Paz (GMT-4)', city: 'La Paz' },

	// 🌍 EUROPE (Ouest, Centre, Est, Sud & Nord)
	{ value: 'Europe/Paris', label: 'France — Paris, Lyon, Marseille (GMT+1)', city: 'Paris' },
	{ value: 'Europe/London', label: 'Royaume-Uni — Londres, Manchester (GMT+0)', city: 'Londres' },
	{ value: 'Europe/Dublin', label: 'Irlande — Dublin (GMT+0)', city: 'Dublin' },
	{ value: 'Europe/Brussels', label: 'Belgique — Bruxelles (GMT+1)', city: 'Bruxelles' },
	{ value: 'Europe/Zurich', label: 'Suisse — Genève, Zurich (GMT+1)', city: 'Genève' },
	{ value: 'Europe/Luxembourg', label: 'Luxembourg (GMT+1)', city: 'Luxembourg' },
	{ value: 'Europe/Berlin', label: 'Allemagne — Berlin, Francfort (GMT+1)', city: 'Berlin' },
	{ value: 'Europe/Amsterdam', label: 'Pays-Bas — Amsterdam, Rotterdam (GMT+1)', city: 'Amsterdam' },
	{ value: 'Europe/Madrid', label: 'Espagne — Madrid, Barcelone (GMT+1)', city: 'Madrid' },
	{ value: 'Europe/Lisbon', label: 'Portugal — Lisbonne, Porto (GMT+0)', city: 'Lisbonne' },
	{ value: 'Europe/Rome', label: 'Italie — Rome, Milan (GMT+1)', city: 'Rome' },
	{ value: 'Europe/Vienna', label: 'Autriche — Vienne (GMT+1)', city: 'Vienne' },
	{ value: 'Europe/Stockholm', label: 'Suède — Stockholm (GMT+1)', city: 'Stockholm' },
	{ value: 'Europe/Oslo', label: 'Norvège — Oslo (GMT+1)', city: 'Oslo' },
	{ value: 'Europe/Copenhagen', label: 'Danemark — Copenhague (GMT+1)', city: 'Copenhague' },
	{ value: 'Europe/Helsinki', label: 'Finlande — Helsinki (GMT+2)', city: 'Helsinki' },
	{ value: 'Europe/Warsaw', label: 'Pologne — Varsovie (GMT+1)', city: 'Varsovie' },
	{ value: 'Europe/Prague', label: 'Tchéquie — Prague (GMT+1)', city: 'Prague' },
	{ value: 'Europe/Budapest', label: 'Hongrie — Budapest (GMT+1)', city: 'Budapest' },
	{ value: 'Europe/Athens', label: 'Grèce — Athènes (GMT+2)', city: 'Athènes' },
	{ value: 'Europe/Bucharest', label: 'Roumanie — Bucarest (GMT+2)', city: 'Bucarest' },
	{ value: 'Europe/Istanbul', label: 'Turquie — Istanbul (GMT+3)', city: 'Istanbul' },

	// 🌏 ASIE, AFRIQUE & PACIFIQUE
	{ value: 'Asia/Seoul', label: 'Corée du Sud — Séoul (GMT+9)', city: 'Séoul' },
	{ value: 'Asia/Tokyo', label: 'Japon — Tokyo (GMT+9)', city: 'Tokyo' },
	{ value: 'Asia/Shanghai', label: 'Chine — Shanghai, Pékin (GMT+8)', city: 'Shanghai' },
	{ value: 'Asia/Singapore', label: 'Singapour (GMT+8)', city: 'Singapour' },
	{ value: 'Asia/Dubai', label: 'Émirats arabes unis — Dubaï (GMT+4)', city: 'Dubaï' },
	{ value: 'Asia/Bangkok', label: 'Thaïlande — Bangkok (GMT+7)', city: 'Bangkok' },
	{ value: 'Africa/Dakar', label: 'Sénégal — Dakar (GMT+0)', city: 'Dakar' },
	{ value: 'Africa/Casablanca', label: 'Maroc — Casablanca (GMT+1)', city: 'Casablanca' },
	{ value: 'Africa/Abidjan', label: 'Côte d\'Ivoire — Abidjan (GMT+0)', city: 'Abidjan' },
	{ value: 'Australia/Sydney', label: 'Australie — Sydney (GMT+11)', city: 'Sydney' }
];

export function isValidTimezone(timezone: string): boolean {
	try {
		new Intl.DateTimeFormat('fr-FR', { timeZone: timezone }).format();
		return true;
	} catch {
		return false;
	}
}

export function getTimezoneLabel(timezone: string): string {
	return TIMEZONE_OPTIONS.find((option) => option.value === timezone)?.label ?? timezone.replaceAll('_', ' ');
}

export function getTimezoneCity(timezone: string): string {
	return TIMEZONE_OPTIONS.find((option) => option.value === timezone)?.city ?? timezone.split('/').at(-1)?.replaceAll('_', ' ') ?? timezone;
}

export function formatDateTimeInTimezone(iso: string, timezone: string): { date: string; time: string } {
	const date = new Date(iso);
	return {
		date: new Intl.DateTimeFormat('fr-FR', {
			timeZone: timezone,
			weekday: 'short',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(date),
		time: new Intl.DateTimeFormat('fr-FR', {
			timeZone: timezone,
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(date)
	};
}

export function formatCurrentTime(timezone: string): string {
	return new Intl.DateTimeFormat('fr-FR', {
		timeZone: timezone,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).format(new Date());
}

function timezoneOffsetMilliseconds(date: Date, timezone: string): number {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(date);
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const representedAsUtc = Date.UTC(
		Number(values.year),
		Number(values.month) - 1,
		Number(values.day),
		Number(values.hour),
		Number(values.minute),
		Number(values.second)
	);
	return representedAsUtc - date.getTime();
}

export function localDateTimeToUtc(dateValue: string, timeValue: string, timezone: string): string | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue) || !isValidTimezone(timezone)) return null;
	const [year, month, day] = dateValue.split('-').map(Number);
	const [hour, minute] = timeValue.split(':').map(Number);
	if (hour > 23 || minute > 59) return null;

	const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
	let result = new Date(utcGuess - timezoneOffsetMilliseconds(new Date(utcGuess), timezone));
	result = new Date(utcGuess - timezoneOffsetMilliseconds(result, timezone));

	const verification = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
	}).formatToParts(result);
	const parts = Object.fromEntries(verification.map((part) => [part.type, part.value]));
	if (`${parts.year}-${parts.month}-${parts.day}` !== dateValue || `${parts.hour}:${parts.minute}` !== timeValue) return null;
	return result.toISOString();
}
