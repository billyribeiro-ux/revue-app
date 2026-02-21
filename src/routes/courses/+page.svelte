<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import gsap from 'gsap';
	import {
		PlusIcon,
		BookOpenIcon,
		FunnelIcon,
		MagnifyingGlassIcon
	} from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { courseRepo } from '$lib/db/repositories/course';
	import { getAppState, addToast, isDbReady } from '$lib/stores/app.svelte';
	import { formatTimeAgo } from '$lib/utils/date';
	import type { Course, CourseStatus, CourseType } from '$lib/types';

	let courses = $state<Course[]>([]);
	let showNewModal = $state(false);
	let filterStatus = $state<string>('');
	let searchQuery = $state('');
	let appState = $derived(getAppState());

	// New course form state
	let newTitle = $state('');
	let newType = $state<CourseType>('course');
	let newProvider = $state('');
	let newDescription = $state('');

	let grid: HTMLElement | undefined;

	$effect(() => {
		if (isDbReady()) loadCourses();
		// Open new modal if URL has ?new=true
		if (page.url.searchParams.get('new') === 'true') {
			showNewModal = true;
		}
	});

	$effect(() => {
		if (grid) {
			gsap.fromTo(
				grid.children,
				{ opacity: 0, y: 15, scale: 0.98 },
				{ opacity: 1, y: 0, scale: 1, stagger: 0.03, duration: 0.35, ease: 'power2.out' }
			);
		}
	});

	async function loadCourses() {
		courses = await courseRepo.getAll(appState.activeWorkspaceId ?? undefined);
	}

	let filteredCourses = $derived(
		courses.filter((c) => {
			if (filterStatus && c.status !== filterStatus) return false;
			if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);

	async function createCourse() {
		if (!newTitle.trim()) return;
		const id = await courseRepo.create({
			workspaceId: appState.activeWorkspaceId || 1,
			title: newTitle.trim(),
			type: newType,
			provider: newProvider as any,
			description: newDescription
		});
		addToast('success', `Course "${newTitle}" created`);
		showNewModal = false;
		newTitle = '';
		newType = 'course';
		newProvider = '';
		newDescription = '';
		await loadCourses();
		goto(`/courses/${id}`);
	}

	const statusColors: Record<string, 'green' | 'yellow' | 'brand' | 'default'> = {
		active: 'green',
		paused: 'yellow',
		completed: 'brand',
		archived: 'default'
	};

	const courseNoteCountCache = $state(new Map<number, number>());

	$effect(() => {
		for (const course of courses) {
			if (course.id && !courseNoteCountCache.has(course.id)) {
				courseRepo.getNoteCount(course.id).then((count) => {
					courseNoteCountCache.set(course.id!, count);
				});
			}
		}
	});
</script>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-surface-100">Courses</h1>
		<Button variant="primary" onclick={() => (showNewModal = true)}>
			<PlusIcon size={16} />
			New Course
		</Button>
	</div>

	<!-- Filters -->
	<div class="flex items-center gap-3 mb-6">
		<div class="relative flex-1 max-w-sm">
			<MagnifyingGlassIcon size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
			<input
				type="text"
				placeholder="Search courses..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-700 bg-surface-900 pl-9 pr-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none"
			/>
		</div>
		<Select
			bind:value={filterStatus}
			placeholder="All statuses"
			options={[
				{ value: '', label: 'All statuses' },
				{ value: 'active', label: 'Active' },
				{ value: 'paused', label: 'Paused' },
				{ value: 'completed', label: 'Completed' },
				{ value: 'archived', label: 'Archived' }
			]}
			class="w-40"
		/>
	</div>

	<!-- Course Grid -->
	{#if filteredCourses.length > 0}
		<div bind:this={grid} class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredCourses as course}
				<a
					href="/courses/{course.id}"
					class="rounded-xl border border-surface-800 bg-surface-900 p-5 hover:border-surface-600 transition-all group"
				>
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center gap-2">
							<Badge label={course.type} variant="brand" size="sm" />
							<Badge label={course.status} variant={statusColors[course.status]} size="sm" />
						</div>
						{#if course.provider}
							<span class="text-xs text-surface-500">{course.provider}</span>
						{/if}
					</div>
					<h3 class="text-base font-semibold text-surface-200 group-hover:text-surface-100 mb-2 line-clamp-2">
						{course.title}
					</h3>
					{#if course.description}
						<p class="text-sm text-surface-500 line-clamp-2 mb-3">{course.description}</p>
					{/if}
					<div class="flex items-center justify-between text-xs text-surface-500 mt-auto pt-3 border-t border-surface-800">
						<span>{courseNoteCountCache.get(course.id!) ?? 0} notes</span>
						<span>{formatTimeAgo(course.updatedAt)}</span>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<EmptyState
			title="No courses yet"
			description="Create your first course to start organizing your learning"
			icon={BookOpenIcon}
		>
			{#snippet action()}
				<Button variant="primary" onclick={() => (showNewModal = true)}>
					<PlusIcon size={16} />
					Create Course
				</Button>
			{/snippet}
		</EmptyState>
	{/if}
</div>

<!-- New Course Modal -->
<Modal bind:open={showNewModal} title="New Course" size="md" onclose={() => (showNewModal = false)}>
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-surface-300 mb-1.5">Title</label>
			<Input bind:value={newTitle} placeholder="e.g., Advanced TypeScript" onkeydown={(e) => { if (e.key === 'Enter') createCourse(); }} />
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-surface-300 mb-1.5">Type</label>
				<Select
					bind:value={newType}
					options={[
						{ value: 'course', label: 'Course' },
						{ value: 'topic', label: 'Topic' },
						{ value: 'project', label: 'Project' },
						{ value: 'certification', label: 'Certification' },
						{ value: 'research', label: 'Research' }
					]}
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-surface-300 mb-1.5">Provider</label>
				<Select
					bind:value={newProvider}
					placeholder="Select..."
					options={[
						{ value: '', label: 'None' },
						{ value: 'udemy', label: 'Udemy' },
						{ value: 'coursera', label: 'Coursera' },
						{ value: 'youtube', label: 'YouTube' },
						{ value: 'book', label: 'Book' },
						{ value: 'other', label: 'Other' }
					]}
				/>
			</div>
		</div>
		<div>
			<label class="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
			<textarea
				bind:value={newDescription}
				placeholder="Brief description..."
				rows={3}
				class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 resize-none"
			></textarea>
		</div>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (showNewModal = false)}>Cancel</Button>
		<Button variant="primary" onclick={createCourse}>Create Course</Button>
	{/snippet}
</Modal>
