import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { claimFreeCourseServer, CourseServerError } from '$lib/server/courses';

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		return json(await claimFreeCourseServer(params.id!, user), { status: 201 });
	} catch (error) {
		const status = error instanceof CourseServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Impossible de débloquer la formation.' }, { status });
	}
};
