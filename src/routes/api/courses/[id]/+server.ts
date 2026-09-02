import { json, type RequestHandler } from '@sveltejs/kit';
import { CourseServerError, getPublicCourseServer } from '$lib/server/courses';

export const GET: RequestHandler = async ({ params }) => {
	try {
		return json(await getPublicCourseServer(params.id!));
	} catch (error) {
		const status = error instanceof CourseServerError ? error.status : 500;
		return json({ message: error instanceof Error ? error.message : 'Impossible de charger la formation.' }, { status });
	}
};
