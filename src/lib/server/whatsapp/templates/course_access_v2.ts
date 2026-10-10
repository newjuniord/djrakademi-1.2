import { sendKapsoTemplate } from '../client';

export interface CourseAccessV2Params {
	to: string;
	courseTitle: string; // Ex: "Mixage & Scratch Pro"
	accessUrl: string;   // Ex: "https://djrakademi.net/auth/magic?token=..."
	customerName?: string;
	languageCode?: string; // Défaut 'fr'
}

/**
 * Envoie le template `course_access_v2`.
 *
 * Exemple de texte du template WhatsApp Meta :
 * "Accès à votre formation {{1}} : {{2}}"
 */
export async function sendCourseAccessV2Template(input: CourseAccessV2Params) {
	const params = [
		{ type: 'text' as const, parameter_name: 'course_title', text: input.courseTitle },
		{ type: 'text' as const, parameter_name: 'access_url', text: input.accessUrl }
	];

	if (input.customerName) {
		params.unshift({ type: 'text' as const, parameter_name: 'customer_name', text: input.customerName });
	}

	return sendKapsoTemplate({
		to: input.to,
		templateName: 'course_access_v2',
		languageCode: input.languageCode || 'fr',
		parameters: params
	});
}
