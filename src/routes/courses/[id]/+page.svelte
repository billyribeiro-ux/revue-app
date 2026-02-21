<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import {
		PlusIcon,
		NoteIcon,
		PushPinIcon,
		TrashIcon,
		PencilIcon,
		CheckCircleIcon,
		QuestionIcon,
		LightbulbIcon,
		ArrowLeftIcon,
		DotsThreeIcon
	} from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { courseRepo } from '$lib/db/repositories/course';
	import { noteRepo } from '$lib/db/repositories/note';
	import { taskRepo } from '$lib/db/repositories/task';
	import { moduleRepo } from '$lib/db/repositories/module';
	import { addToast, isDbReady } from '$lib/stores/app.svelte';
	import { formatTimeAgo, formatDate } from '$lib/utils/date';
	import { courseToMarkdown, downloadFile } from '$lib/utils/export';
	import type { Course, Note, Task, Module, CourseType, CourseStatus, CourseProvider } from '$lib/types';

	let courseId = $derived(Number(page.params.id));
	let course = $state<Course | null>(null);
	let notes = $state<Note[]>([]);
	let pinnedNotes = $state<Note[]>([]);
	let tasks = $state<Task[]>([]);
	let modules = $state<Module[]>([]);
	let showDeleteConfirm = $state(false);
	let showEditModal = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let editType = $state<CourseType>('course');
	let editStatus = $state<CourseStatus>('active');
	let editProvider = $state<CourseProvider>('');
	let editTags = $state('');

	let container: HTMLElement | undefined;

	$effect(() => {
		if (isDbReady()) loadCourse(courseId);
	});

	$effect(() => {
		if (container) {
			gsap.fromTo(
				container.children,
				{ opacity: 0, y: 15 },
				{ opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out' }
			);
		}
	});

	async function loadCourse(id: number) {
		course = (await courseRepo.getById(id)) || null;
		if (!course) return;
		notes = await noteRepo.getAll({ courseId: id });
		pinnedNotes = notes.filter((n) => n.pinned);
		tasks = await taskRepo.getAll({ courseId: id });
		modules = await moduleRepo.getByCourseId(id);
	}

	async function createNote() {
		const id = await noteRepo.create({
			courseId,
			workspaceId: course?.workspaceId,
			title: 'Untitled Note'
		});
		goto(`/note/${id}`);
	}

	async function deleteCourse() {
		await courseRepo.remove(courseId);
		addToast('success', 'Course deleted');
		goto('/courses');
	}

	function openEditModal() {
		if (course) {
			editTitle = course.title;
			editDescription = course.description;
			editType = course.type;
			editStatus = course.status;
			editProvider = course.provider || '';
			editTags = course.tags.join(', ');
			showEditModal = true;
		}
	}

	async function saveCourseEdit() {
		if (!course?.id) return;
		await courseRepo.update(course.id, {
			title: editTitle.trim(),
			description: editDescription.trim(),
			type: editType,
			status: editStatus,
			provider: editProvider || ('' as CourseProvider),
			tags: editTags.split(',').map((t) => t.trim()).filter(Boolean)
		});
		await loadCourse(courseId);
		showEditModal = false;
		addToast('success', 'Course updated');
	}

	async function exportCourse() {
		if (!course?.id) return;
		const md = await courseToMarkdown(course.id);
		const safeTitle = course.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
		await downloadFile(md, `${safeTitle}.md`, 'text/markdown');
		addToast('success', 'Course exported');
	}

	let completedModules = $derived(modules.filter((m) => m.completed).length);
	let progress = $derived(modules.length > 0 ? (completedModules / modules.length) * 100 : 0);
	let openTasks = $derived(tasks.filter((t) => t.status !== 'done'));
	let completedTasks = $derived(tasks.filter((t) => t.status === 'done'));

	const statusColors: Record<string, 'green' | 'yellow' | 'brand' | 'default'> = {
		active: 'green',
		paused: 'yellow',
		completed: 'brand',
		archived: 'default'
	};
</script>

{#if course}
	<div bind:this={container} class="p-6 max-w-5xl mx-auto space-y-6">
		<!-- Breadcrumb + Header -->
		<div>
			<a href="/courses" class="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-300 mb-3">
				<ArrowLeftIcon size={14} />
				All Courses
			</a>
			<div class="flex items-start justify-between">
				<div>
					<div class="flex items-center gap-2 mb-2">
						<Badge label={course.type} variant="brand" />
						<Badge label={course.status} variant={statusColors[course.status]} />
						{#if course.provider}
							<Badge label={course.provider} />
						{/if}
					</div>
					<h1 class="text-2xl font-bold text-surface-100">{course.title}</h1>
					{#if course.description}
						<p class="text-sm text-surface-400 mt-1">{course.description}</p>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<Button variant="primary" onclick={createNote}>
						<PlusIcon size={16} />
						New Note
					</Button>
					<Dropdown
						align="right"
						items={[
							{ label: 'Edit Course', onclick: openEditModal },
							{ label: 'Export Course', onclick: exportCourse },
							{ label: 'Delete Course', onclick: () => (showDeleteConfirm = true), variant: 'danger' }
						]}
					>
						{#snippet trigger()}
							<button class="rounded-lg p-2 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors">
								<DotsThreeIcon size={20} weight="bold" />
							</button>
						{/snippet}
					</Dropdown>
				</div>
			</div>
		</div>

		<!-- Progress -->
		{#if modules.length > 0}
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-semibold text-surface-300">Progress</h2>
					<span class="text-sm text-surface-400">{completedModules} / {modules.length} modules</span>
				</div>
				<ProgressBar value={progress} color="brand" size="md" showLabel />
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main content (2/3) -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Pinned Notes -->
				{#if pinnedNotes.length > 0}
					<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
						<h2 class="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
							<PushPinIcon size={14} />
							Pinned Notes
						</h2>
						<div class="space-y-2">
							{#each pinnedNotes as note}
								<a
									href="/note/{note.id}"
									class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-800 transition-colors"
								>
									<div class="flex items-center gap-2">
										<NoteIcon size={14} class="text-surface-500" />
										<span class="text-sm text-surface-200">{note.title}</span>
										<Badge label={note.noteType} size="sm" />
									</div>
									<span class="text-xs text-surface-600">{formatTimeAgo(note.lastEditedAt)}</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- All Notes -->
				<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-sm font-semibold text-surface-300">Notes ({notes.length})</h2>
						<Button size="sm" variant="ghost" onclick={createNote}>
							<PlusIcon size={14} />
							Add Note
						</Button>
					</div>
					{#if notes.length > 0}
						<div class="space-y-2">
							{#each notes as note}
								<a
									href="/note/{note.id}"
									class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-800 transition-colors group"
								>
									<div class="flex items-center gap-2 min-w-0">
										<NoteIcon size={14} class="text-surface-500 shrink-0" />
										<span class="text-sm text-surface-200 truncate group-hover:text-surface-100">{note.title}</span>
										<Badge label={note.noteType} size="sm" />
										{#if note.pinned}
											<PushPinIcon size={12} class="text-accent-yellow" />
										{/if}
									</div>
									<span class="text-xs text-surface-600 shrink-0 ml-2">{formatTimeAgo(note.lastEditedAt)}</span>
								</a>
							{/each}
						</div>
					{:else}
						<EmptyState
							title="No notes yet"
							description="Add your first note to this course"
							icon={NoteIcon}
						>
							{#snippet action()}
								<Button size="sm" variant="primary" onclick={createNote}>
									<PlusIcon size={14} />
									Create Note
								</Button>
							{/snippet}
						</EmptyState>
					{/if}
				</div>
			</div>

			<!-- Sidebar (1/3) -->
			<div class="space-y-6">
				<!-- Key Concepts -->
				<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
					<h2 class="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
						<LightbulbIcon size={14} />
						Key Concepts
					</h2>
					{#if course.keyConcepts.length > 0}
						<ul class="space-y-1.5">
							{#each course.keyConcepts as concept}
								<li class="text-sm text-surface-400">{concept}</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-surface-600 italic">No concepts added yet</p>
					{/if}
				</div>

				<!-- Open Questions -->
				<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
					<h2 class="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
						<QuestionIcon size={14} />
						Open Questions
					</h2>
					{#if course.openQuestions.length > 0}
						<ul class="space-y-1.5">
							{#each course.openQuestions as q}
								<li class="text-sm text-surface-400">{q}</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-surface-600 italic">No open questions</p>
					{/if}
				</div>

				<!-- Tasks -->
				<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
					<h2 class="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
						<CheckCircleIcon size={14} />
						Tasks ({openTasks.length} open)
					</h2>
					{#if tasks.length > 0}
						<div class="space-y-1.5">
							{#each openTasks.slice(0, 5) as task}
								<div class="flex items-center gap-2 text-sm">
									<button
										onclick={async () => {
											await taskRepo.updateStatus(task.id!, 'done');
											await loadCourse(courseId);
										}}
										class="h-3.5 w-3.5 rounded-sm border border-surface-600 hover:border-brand-500 shrink-0"
									></button>
									<span class="text-surface-400 truncate">{task.title}</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-surface-600 italic">No tasks</p>
					{/if}
				</div>

				<!-- Info -->
				<div class="rounded-xl border border-surface-800 bg-surface-900 p-5 text-xs text-surface-500 space-y-1">
					<p>Created: {formatDate(course.createdAt)}</p>
					<p>Updated: {formatTimeAgo(course.updatedAt)}</p>
					{#if course.startDate}
						<p>Started: {formatDate(course.startDate)}</p>
					{/if}
					{#if course.tags.length > 0}
						<div class="flex flex-wrap gap-1 mt-2">
							{#each course.tags as tag}
								<Badge label={tag} size="sm" />
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-surface-500">Course not found</p>
	</div>
{/if}

<ConfirmDialog
	bind:open={showDeleteConfirm}
	title="Delete Course"
	message="This will permanently delete this course and all its notes. This action cannot be undone."
	confirmLabel="Delete Course"
	confirmVariant="danger"
	onconfirm={deleteCourse}
	oncancel={() => (showDeleteConfirm = false)}
/>

<Modal bind:open={showEditModal} title="Edit Course" size="md" onclose={() => (showEditModal = false)}>
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-surface-300 mb-1.5">Title</label>
			<Input bind:value={editTitle} placeholder="Course title" onkeydown={(e) => { if (e.key === 'Enter') saveCourseEdit(); }} />
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-surface-300 mb-1.5">Type</label>
				<Select
					bind:value={editType}
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
				<label class="block text-sm font-medium text-surface-300 mb-1.5">Status</label>
				<Select
					bind:value={editStatus}
					options={[
						{ value: 'active', label: 'Active' },
						{ value: 'paused', label: 'Paused' },
						{ value: 'completed', label: 'Completed' },
						{ value: 'archived', label: 'Archived' }
					]}
				/>
			</div>
		</div>
		<div>
			<label class="block text-sm font-medium text-surface-300 mb-1.5">Provider</label>
			<Select
				bind:value={editProvider}
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
		<div>
			<label class="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
			<textarea
				bind:value={editDescription}
				placeholder="Brief description..."
				rows={3}
				class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 resize-none"
			></textarea>
		</div>
		<div>
			<label class="block text-sm font-medium text-surface-300 mb-1.5">Tags (comma-separated)</label>
			<Input bind:value={editTags} placeholder="e.g. typescript, frontend, react" />
		</div>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (showEditModal = false)}>Cancel</Button>
		<Button variant="primary" onclick={saveCourseEdit}>Save Changes</Button>
	{/snippet}
</Modal>
