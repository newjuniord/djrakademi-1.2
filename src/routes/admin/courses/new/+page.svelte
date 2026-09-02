<script lang="ts">
	import { goto } from '$app/navigation';
	import CourseForm from '$lib/components/admin/CourseForm.svelte';
	import type { Course } from '$lib/types/admin';
	import { createCourse } from '$lib/services/courses';
	import { ArrowLeft } from 'lucide-svelte';

	let saving = $state(false);

	async function handleSave(courseData: Course, coverFile?: File | null) {
		saving = true;
		try {
			const newCourse = await createCourse(courseData, coverFile);
			goto(`/admin/courses/${newCourse.id}`);
		} catch (e) {
			console.error('Error creating course:', e);
			goto('/admin/courses');
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/admin/courses');
	}
</script>

<svelte:head>
	<title>Nouveau cours · Administration</title>
</svelte:head>

<div class="space-y-10 p-1">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-2">
				<a
					href="/admin/courses"
					class="btn btn-ghost btn-xs rounded-none gap-1 font-semibold text-xs text-base-content/60 hover:text-base-content"
				>
					<ArrowLeft size={14} />
					Retour aux cours
				</a>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">Nouveau cours</h1>
			<p class="text-sm text-base-content/60 mt-1">Remplissez les informations ci-dessous pour créer votre formation.</p>
		</div>
	</div>

	<!-- Form Component -->
	<CourseForm saving={saving} onSave={handleSave} onCancel={handleCancel} />
</div>
