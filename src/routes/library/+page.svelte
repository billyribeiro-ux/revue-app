<script lang="ts">
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import {
		MagnifyingGlassIcon,
		FunnelIcon,
		PlusIcon,
		NoteIcon,
		GridFourIcon,
		ListIcon,
		StarIcon,
		PushPinIcon,
		BookOpenIcon
	} from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { noteRepo } from '$lib/db/repositories/note';
	import { courseRepo } from '$lib/db/repositories/course';
	import { search as searchEngine } from '$lib/db/search';
	import { getAppState, addToast } from '$lib/stores/app.svelte';
	import { formatTimeAgo } from '$lib/utils/date';
	import type { Note, NoteType, Course, SearchResult } from '$lib/types';

	let notes = $state<Note[]>([]);
	let courses = $state<Course[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let filterType = $state('');
	let filterCourse = $state('');
	let viewMode = $state<'grid' | 'list'>('grid');
	let appState = $derived(getAppState());

	let grid: HTMLElement | undefined;

	$effect(() => {
		loadData();
	});

	$effect(() => {
		if (grid) {
			gsap.fromTo(
				grid.children,
				{ opacity: 0, y: 10 },
				{ opacity: 1, y: 0, stagger: 0.02, duration: 0.3, ease: 'power2.out' }
			);
		}
	});

	async function loadData() {
		notes = await noteRepo.getAll({ workspaceId: appState.activeWorkspaceId ?? undefined });
		courses = await courseRepo.getAll(appState.activeWorkspaceId ?? undefined);
	}

	$effect(() => {
		if (searchQuery.length > 1) {
			performSearch(searchQuery);
		} else {
			searchResults = [];
		}
	});

	async function performSearch(query: string) {
		searchResults = await searchEngine(query, 30);
	}

	let filteredNotes = $derived(() => {
		let result = notes;
		if (filterType) {
			result = result.filter((n) => n.noteType === filterType);
		}
		if (filterCourse) {
			result = result.filter((n) => n.courseId === Number(filterCourse));
		}
		return result;
	});

	async function createNote() {
		const id = await noteRepo.create({
			title: 'Untitled Note',
			workspaceId: appState.activeWorkspaceId
		});
		goto(`/note/${id}`);
	}

	const noteTypeOptions = [
		{ value: '', label: 'All types' },
		{ value: 'lecture', label: 'Lecture Notes' },
		{ value: 'concept', label: 'Concept Card' },
		{ value: 'practice', label: 'Practice' },
		{ value: 'review', label: 'Review' },
		{ value: 'cheatsheet', label: 'Cheat Sheet' },
		{ value: 'buildlog', label: 'Build Log' },
		{ value: 'trading', label: 'Trading' },
		{ value: 'postmortem', label: 'Post-Mortem' },
		{ value: 'general', label: 'General' }
	];
</script>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-surface-100">Library</h1>
		<div class="flex items-center gap-2">
			<div class="flex items-center border border-surface-700 rounded-lg">
				<button
					onclick={() => (viewMode = 'grid')}
					class="p-2 transition-colors rounded-l-lg {viewMode === 'grid' ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'}"
				>
					<GridFourIcon size={16} />
				</button>
				<button
					onclick={() => (viewMode = 'list')}
					class="p-2 transition-colors rounded-r-lg {viewMode === 'list' ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'}"
				>
					<ListIcon size={16} />
				</button>
			</div>
			<Button variant="primary" onclick={createNote}>
				<PlusIcon size={16} />
				New Note
			</Button>
		</div>
	</div>

	<!-- Search + Filters -->
	<div class="flex flex-wrap items-center gap-3 mb-6">
		<div class="relative flex-1 min-w-[240px]">
			<MagnifyingGlassIcon size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
			<input
				type="text"
				placeholder="Search notes, courses, tags..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-surface-700 bg-surface-900 pl-9 pr-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none"
			/>
		</div>
		<Select bind:value={filterType} options={noteTypeOptions} placeholder="All types" class="w-40" />
		<Select
			bind:value={filterCourse}
			placeholder="All courses"
			options={[
				{ value: '', label: 'All courses' },
				...courses.map((c) => ({ value: String(c.id), label: c.title }))
			]}
			class="w-48"
		/>
	</div>

	<!-- Search Results -->
	{#if searchQuery.length > 1 && searchResults.length > 0}
		<div class="mb-6">
			<h2 class="text-sm font-semibold text-surface-400 mb-3">Search Results ({searchResults.length})</h2>
			<div class="space-y-2">
				{#each searchResults as result}
					<a
						href={result.type === 'note' ? `/note/${result.id}` : result.type === 'course' ? `/courses/${result.id}` : '#'}
						class="flex items-center gap-3 rounded-lg border border-surface-800 bg-surface-900 px-4 py-3 hover:border-surface-600 transition-colors"
					>
						{#if result.type === 'note'}
							<NoteIcon size={16} class="text-surface-500" />
						{:else if result.type === 'course'}
							<BookOpenIcon size={16} class="text-surface-500" />
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-surface-200 truncate">{result.title}</p>
							<p class="text-xs text-surface-500 truncate">{result.subtitle}</p>
						</div>
						<Badge label={result.type} size="sm" />
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Notes Display -->
	{#if filteredNotes().length > 0}
		{#if viewMode === 'grid'}
			<div bind:this={grid} class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredNotes() as note}
					<a
						href="/note/{note.id}"
						class="rounded-xl border border-surface-800 bg-surface-900 p-4 hover:border-surface-600 transition-colors group"
					>
						<div class="flex items-start justify-between mb-2">
							<Badge label={note.noteType} size="sm" />
							<div class="flex items-center gap-1">
								{#if note.favorited}
									<StarIcon size={12} weight="fill" class="text-accent-yellow" />
								{/if}
								{#if note.pinned}
									<PushPinIcon size={12} weight="fill" class="text-brand-400" />
								{/if}
							</div>
						</div>
						<h3 class="font-medium text-surface-200 group-hover:text-surface-100 truncate">{note.title}</h3>
						<p class="mt-1 text-xs text-surface-500 line-clamp-3">{note.bodyPlaintext.substring(0, 150)}</p>
						<div class="mt-3 flex items-center justify-between">
							<div class="flex gap-1">
								{#each note.tags.slice(0, 3) as tag}
									<Badge label={tag} size="sm" />
								{/each}
							</div>
							<span class="text-xs text-surface-600">{formatTimeAgo(note.lastEditedAt)}</span>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div bind:this={grid} class="space-y-2">
				{#each filteredNotes() as note}
					<a
						href="/note/{note.id}"
						class="flex items-center gap-4 rounded-lg border border-surface-800 bg-surface-900 px-4 py-3 hover:border-surface-600 transition-colors group"
					>
						<div class="flex items-center gap-1 shrink-0">
							{#if note.favorited}
								<StarIcon size={14} weight="fill" class="text-accent-yellow" />
							{/if}
							{#if note.pinned}
								<PushPinIcon size={14} weight="fill" class="text-brand-400" />
							{/if}
						</div>
						<span class="font-medium text-surface-200 group-hover:text-surface-100 truncate flex-1">{note.title}</span>
						<Badge label={note.noteType} size="sm" />
						<div class="flex gap-1 shrink-0">
							{#each note.tags.slice(0, 2) as tag}
								<Badge label={tag} size="sm" />
							{/each}
						</div>
						<span class="text-xs text-surface-600 shrink-0">{formatTimeAgo(note.lastEditedAt)}</span>
					</a>
				{/each}
			</div>
		{/if}
	{:else if !searchQuery}
		<EmptyState
			title="No notes yet"
			description="Create your first note to build your knowledge library"
			icon={NoteIcon}
		>
			{#snippet action()}
				<Button variant="primary" onclick={createNote}>
					<PlusIcon size={16} />
					Create Note
				</Button>
			{/snippet}
		</EmptyState>
	{/if}
</div>
