<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import gsap from 'gsap';
	import {
		HouseIcon,
		BookOpenIcon,
		BooksIcon,
		ChartBarIcon,
		TrayIcon,
		GearIcon,
		PlusIcon,
		StarIcon,
		FolderIcon,
		TagIcon,
		MagnifyingGlassIcon,
		CaretDownIcon,
		CaretRightIcon
	} from 'phosphor-svelte';
	import { getAppState, setActiveWorkspace } from '$lib/stores/app.svelte';
	import { workspaceRepo } from '$lib/db/repositories/workspace';
	import { courseRepo } from '$lib/db/repositories/course';
	import { noteRepo } from '$lib/db/repositories/note';
	import type { Workspace, Course, Note } from '$lib/types';

	let appState = $derived(getAppState());

	let workspaces = $state<Workspace[]>([]);
	let courses = $state<Course[]>([]);
	let favorites = $state<Note[]>([]);
	let coursesExpanded = $state(true);
	let favoritesExpanded = $state(true);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		workspaces = await workspaceRepo.getAll();
		if (workspaces.length > 0 && !appState.activeWorkspaceId) {
			setActiveWorkspace(workspaces[0].id!);
		}
		if (appState.activeWorkspaceId) {
			courses = await courseRepo.getAll(appState.activeWorkspaceId);
		} else {
			courses = await courseRepo.getAll();
		}
		favorites = await noteRepo.getAll({ favorited: true, limit: 10 });
	}

	// Reload data whenever workspace changes
	$effect(() => {
		if (appState.activeWorkspaceId) {
			loadData();
		}
	});

	const navItems = [
		{ id: 'today', label: 'Today', icon: HouseIcon, href: '/' },
		{ id: 'courses', label: 'Courses', icon: BookOpenIcon, href: '/courses' },
		{ id: 'library', label: 'Library', icon: BooksIcon, href: '/library' },
		{ id: 'review', label: 'Review', icon: ChartBarIcon, href: '/review' },
		{ id: 'inbox', label: 'Inbox', icon: TrayIcon, href: '/inbox' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	const statusColors: Record<string, string> = {
		active: 'bg-accent-green',
		paused: 'bg-accent-yellow',
		completed: 'bg-brand-500',
		archived: 'bg-surface-600'
	};
</script>

<aside class="flex h-full w-64 flex-col border-r border-surface-800 bg-surface-950">
	<!-- Workspace selector -->
	<div class="border-b border-surface-800 p-3">
		<select
			id="sidebar-workspace"
			name="active-workspace"
			class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-surface-200 focus:border-brand-500 focus:outline-none"
			value={appState.activeWorkspaceId?.toString() || ''}
			onchange={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				setActiveWorkspace(val ? Number(val) : null);
			}}
		>
			{#each workspaces as ws}
				<option value={ws.id?.toString()}>{ws.name}</option>
			{/each}
		</select>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto p-2">
		<div class="space-y-0.5">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
						{isActive(item.href)
							? 'bg-surface-800 text-surface-100 font-medium'
							: 'text-surface-400 hover:bg-surface-800/50 hover:text-surface-200'}"
				>
					<svelte:component this={item.icon} size={18} weight={isActive(item.href) ? 'fill' : 'regular'} />
					{item.label}
				</a>
			{/each}
		</div>

		<!-- Courses section -->
		<div class="mt-6">
			<div class="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-500 hover:text-surface-300">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span class="cursor-pointer" onclick={() => (coursesExpanded = !coursesExpanded)}>Courses</span>
				<div class="flex items-center gap-1">
					<button
						onclick={() => goto('/courses?new=true')}
						class="rounded p-0.5 hover:bg-surface-800"
						aria-label="New course"
					>
						<PlusIcon size={14} />
					</button>
					<button onclick={() => (coursesExpanded = !coursesExpanded)} aria-label="Toggle courses">
						{#if coursesExpanded}
							<CaretDownIcon size={12} />
						{:else}
							<CaretRightIcon size={12} />
						{/if}
					</button>
				</div>
			</div>

			{#if coursesExpanded}
				<div class="mt-1 space-y-0.5">
					{#each courses.slice(0, 15) as course}
						<a
							href="/courses/{course.id}"
							class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors
								{page.url.pathname === `/courses/${course.id}`
									? 'bg-surface-800 text-surface-100'
									: 'text-surface-400 hover:bg-surface-800/50 hover:text-surface-300'}"
						>
							<span class="h-2 w-2 rounded-full {statusColors[course.status]} shrink-0"></span>
							<span class="truncate">{course.title}</span>
						</a>
					{/each}
					{#if courses.length === 0}
						<p class="px-3 py-2 text-xs text-surface-600 italic">No courses yet</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Favorites section -->
		<div class="mt-6">
			<button
				onclick={() => (favoritesExpanded = !favoritesExpanded)}
				class="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-500 hover:text-surface-300"
			>
				<span>Favorites</span>
				{#if favoritesExpanded}
					<CaretDownIcon size={12} />
				{:else}
					<CaretRightIcon size={12} />
				{/if}
			</button>

			{#if favoritesExpanded}
				<div class="mt-1 space-y-0.5">
					{#each favorites as note}
						<a
							href="/note/{note.id}"
							class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors
								{page.url.pathname === `/note/${note.id}`
									? 'bg-surface-800 text-surface-100'
									: 'text-surface-400 hover:bg-surface-800/50 hover:text-surface-300'}"
						>
							<StarIcon size={14} weight="fill" class="text-accent-yellow shrink-0" />
							<span class="truncate">{note.title}</span>
						</a>
					{/each}
					{#if favorites.length === 0}
						<p class="px-3 py-2 text-xs text-surface-600 italic">No favorites yet</p>
					{/if}
				</div>
			{/if}
		</div>
	</nav>

	<!-- Bottom actions -->
	<div class="border-t border-surface-800 p-2">
		<a
			href="/settings"
			class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-surface-400 hover:bg-surface-800/50 hover:text-surface-200 transition-colors"
		>
			<GearIcon size={18} />
			Settings
		</a>
	</div>
</aside>
