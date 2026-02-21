<script lang="ts">
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import {
		PlusIcon,
		NoteIcon,
		TimerIcon,
		CheckCircleIcon,
		LightningIcon,
		ArrowRightIcon
	} from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { noteRepo } from '$lib/db/repositories/note';
	import { taskRepo } from '$lib/db/repositories/task';
	import { sessionRepo } from '$lib/db/repositories/session';
	import { getAppState, setActiveSession, addToast, isDbReady } from '$lib/stores/app.svelte';
	import { formatTimeAgo, formatDuration, getTodayRange } from '$lib/utils/date';
	import type { Note, Task, Session } from '$lib/types';

	let editedToday = $state<Note[]>([]);
	let recentNotes = $state<Note[]>([]);
	let openTasks = $state<Task[]>([]);
	let todaySessions = $state<Session[]>([]);
	let appState = $derived(getAppState());

	let container = $state<HTMLElement | undefined>();

	$effect(() => {
		if (isDbReady()) {
			loadTodayData().catch((err) => {
				console.error('Failed to load today data:', err);
			});
		}
	});

	$effect(() => {
		if (!container) return;
		const tween = gsap.fromTo(
			container.children,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
		);
		return () => tween?.kill();
	});

	async function loadTodayData() {
		editedToday = await noteRepo.getEditedToday();
		recentNotes = await noteRepo.getRecent(5);
		openTasks = await taskRepo.getOpen();
		const { start, end } = getTodayRange();
		todaySessions = await sessionRepo.getByDateRange(start, end);
	}

	async function quickNewNote() {
		const id = await noteRepo.create({ title: 'Untitled Note' });
		goto(`/note/${id}`);
	}

	async function startSession() {
		const id = await sessionRepo.create({ workspaceId: appState.activeWorkspaceId });
		setActiveSession(id);
		addToast('success', 'Study session started');
		await loadTodayData();
	}

	const statusVariant: Record<string, 'default' | 'brand' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan'> = {
		open: 'yellow',
		doing: 'brand',
		blocked: 'red',
		done: 'green'
	};
</script>

<div bind:this={container} class="p-6 max-w-5xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-surface-100">Today</h1>
			<p class="text-sm text-surface-500 mt-0.5">
				{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" onclick={startSession}>
				<TimerIcon size={16} />
				Start Session
			</Button>
			<Button variant="primary" onclick={quickNewNote}>
				<PlusIcon size={16} />
				New Note
			</Button>
		</div>
	</div>

	<!-- Quick stats -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<div class="flex items-center gap-2 text-surface-500 mb-2">
				<NoteIcon size={16} />
				<span class="text-xs font-medium uppercase tracking-wider">Notes Edited</span>
			</div>
			<p class="text-2xl font-bold text-surface-100">{editedToday.length}</p>
		</div>
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<div class="flex items-center gap-2 text-surface-500 mb-2">
				<TimerIcon size={16} />
				<span class="text-xs font-medium uppercase tracking-wider">Sessions</span>
			</div>
			<p class="text-2xl font-bold text-surface-100">{todaySessions.length}</p>
		</div>
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<div class="flex items-center gap-2 text-surface-500 mb-2">
				<CheckCircleIcon size={16} />
				<span class="text-xs font-medium uppercase tracking-wider">Tasks Open</span>
			</div>
			<p class="text-2xl font-bold text-surface-100">{openTasks.length}</p>
		</div>
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<div class="flex items-center gap-2 text-surface-500 mb-2">
				<LightningIcon size={16} />
				<span class="text-xs font-medium uppercase tracking-wider">Study Time</span>
			</div>
			<p class="text-2xl font-bold text-surface-100">
				{formatDuration(todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0))}
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Notes edited today -->
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-base font-semibold text-surface-200">Edited Today</h2>
				<span class="text-xs text-surface-500">{editedToday.length} notes</span>
			</div>
			{#if editedToday.length > 0}
				<div class="space-y-2">
					{#each editedToday.slice(0, 8) as note}
						<a
							href="/note/{note.id}"
							class="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-surface-800 transition-colors group"
						>
							<div class="flex items-center gap-2 min-w-0">
								<NoteIcon size={14} class="text-surface-500 shrink-0" />
								<span class="text-surface-200 truncate group-hover:text-surface-100">{note.title}</span>
								<Badge label={note.noteType} size="sm" />
							</div>
							<span class="text-xs text-surface-600 shrink-0 ml-2">{formatTimeAgo(note.lastEditedAt)}</span>
						</a>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-surface-500 py-4 text-center">No notes edited today. Start writing!</p>
			{/if}
		</div>

		<!-- Open tasks -->
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-base font-semibold text-surface-200">Open Tasks</h2>
				<span class="text-xs text-surface-500">{openTasks.length} tasks</span>
			</div>
			{#if openTasks.length > 0}
				<div class="space-y-2">
					{#each openTasks.slice(0, 8) as task}
						<div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-800 transition-colors">
							<button
								aria-label="Mark task as complete"
								onclick={async () => {
									await taskRepo.updateStatus(task.id!, 'done');
									await loadTodayData();
									addToast('success', 'Task completed');
								}}
								class="h-4 w-4 rounded border border-surface-600 hover:border-brand-500 shrink-0 transition-colors"
							></button>
							<span class="text-surface-300 truncate">{task.title}</span>
							<Badge label={task.status} variant={statusVariant[task.status]} size="sm" />
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-surface-500 py-4 text-center">No open tasks. Nice work!</p>
			{/if}
		</div>

		<!-- Continue where you left off -->
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-5 lg:col-span-2">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-base font-semibold text-surface-200">Continue Where You Left Off</h2>
				<a href="/library" class="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
					View all <ArrowRightIcon size={12} />
				</a>
			</div>
			{#if recentNotes.length > 0}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each recentNotes as note}
						<a
							href="/note/{note.id}"
							class="rounded-lg border border-surface-700 bg-surface-850 p-4 hover:border-surface-600 transition-colors group"
						>
							<h3 class="font-medium text-surface-200 truncate group-hover:text-surface-100">{note.title}</h3>
							<p class="mt-1 text-xs text-surface-500 line-clamp-2">{note.bodyPlaintext.substring(0, 120)}</p>
							<div class="mt-3 flex items-center gap-2">
								<Badge label={note.noteType} size="sm" />
								<span class="text-xs text-surface-600">{formatTimeAgo(note.lastEditedAt)}</span>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<EmptyState
					title="No recent notes"
					description="Create your first note to get started"
					icon={NoteIcon}
				>
					{#snippet action()}
						<Button variant="primary" onclick={quickNewNote}>
							<PlusIcon size={16} />
							Create Note
						</Button>
					{/snippet}
				</EmptyState>
			{/if}
		</div>
	</div>
</div>
