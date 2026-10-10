import type { PageServerLoad } from './$types';
import { getCoachingWhatsapp } from '$lib/server/coaching-contact';

export const load: PageServerLoad = async () => ({
	supportWhatsapp: await getCoachingWhatsapp()
});
