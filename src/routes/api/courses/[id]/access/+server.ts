import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { CourseServerError, hasCourseAccessServer } from '$lib/server/courses';

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		return json({ owned: await hasCourseAccessServer(params.id!, user.$id) });
	} catch (error) {
		const status = error instanceof CourseServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ owned: false, message: error instanceof Error ? error.message : 'Vérification impossible.' }, { status });
	}
};
