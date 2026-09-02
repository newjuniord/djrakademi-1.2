import { json, type RequestHandler } from '@sveltejs/kit';
import { requirePaymentUser, PaymentServerError } from '$lib/server/payments';
import { CourseServerError, getOwnedCourseServer, saveCourseProgressServer } from '$lib/server/courses';

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		return json(await getOwnedCourseServer(params.id!, user.$id));
	} catch (error) {
		const status = error instanceof CourseServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Impossible de charger les leçons.' }, { status });
	}
};

export const PUT: RequestHandler = async ({ request, params }) => {
	try {
		const user = await requirePaymentUser(request);
		return json(await saveCourseProgressServer(params.id!, user.$id, await request.json()));
	} catch (error) {
		const status = error instanceof CourseServerError || error instanceof PaymentServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Impossible d’enregistrer la progression.' }, { status });
	}
};
