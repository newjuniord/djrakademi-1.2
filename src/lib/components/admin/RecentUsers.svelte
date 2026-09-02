<script lang="ts">
	import { ArrowRight, User } from 'lucide-svelte';
	import type { RecentUser } from '$lib/types/admin';

	let { users }: { users: RecentUser[] } = $props();
</script>

<section class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden">
	<div class="card-body gap-0 p-6">
		<h2 class="mb-2 text-base font-semibold">Nouveaux utilisateurs</h2>
		<ul class="divide-y divide-base-200">
			{#each users.slice(0, 4) as user}
				<li class="flex items-center gap-3 py-3 first:pt-2">
					<div class="avatar placeholder shrink-0">
						<div class="w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
							<User size={16} />
						</div>
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{user.name}</p>
						<p class="truncate text-xs text-base-content/55">{user.email}</p>
					</div>
					<time class="shrink-0 text-xs text-base-content/50">{user.joinedAt}</time>
				</li>
			{/each}
		</ul>
		<a class="btn btn-ghost bg-base-200/60 hover:bg-base-200 border-none rounded-none mt-3 min-h-11 w-full text-xs font-semibold" href="/admin/users">
			Voir tous les utilisateurs <ArrowRight size={16} />
		</a>
	</div>
</section>
