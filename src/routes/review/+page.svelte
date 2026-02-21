<script lang="ts">
	import gsap from 'gsap';
	import {
		CalendarIcon,
		ChartBarIcon,
		NoteIcon,
		CheckCircleIcon,
		TimerIcon,
		LightbulbIcon,
		QuestionIcon
	} from 'phosphor-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import { noteRepo } from '$lib/db/repositories/note';
	import { courseRepo } from '$lib/db/repositories/course';
	import { taskRepo } from '$lib/db/repositories/task';
	import { sessionRepo } from '$lib/db/repositories/session';
	import { tagRepo } from '$lib/db/repositories/tag';
	import { db } from '$lib/db';
	import { moduleRepo } from '$lib/db/repositories/module';
	import { getWeekRange, getMonthRange, formatDuration, formatDate } from '$lib/utils/date';
	import { loadReflection, saveReflection, type ReviewReflectionData } from '$lib/utils/review-reflection';
	import { isDbReady } from '$lib/stores/app.svelte';
	import type { WeeklyReviewData, MonthlyReviewData } from '$lib/types';

	let activeTab = $state('weekly');
	let weeklyData = $state<WeeklyReviewData | null>(null);
	let monthlyData = $state<MonthlyReviewData | null>(null);
	let reflection = $state<ReviewReflectionData>({
		whatClicked: '',
		whatDidntClick: '',
		whatToRevisit: '',
		planForNext: ''
	});
	let saveTimeout: ReturnType<typeof setTimeout> | undefined;

	let container = $state<HTMLElement | undefined>();

	$effect(() => {
		if (isDbReady()) {
			loadReviewData().catch((err) => {
				console.error('Failed to load review data:', err);
			});
		}
	});

	$effect(() => {
		reflection = loadReflection(activeTab === 'weekly');
	});

	$effect(() => {
		if (!container) return;
		const tween = gsap.fromTo(
			container.children,
			{ opacity: 0, y: 15 },
			{ opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out' }
		);
		return () => tween?.kill();
	});

	$effect(() => () => {
		if (saveTimeout) clearTimeout(saveTimeout);
	});

	async function loadReviewData() {
		const weekRange = getWeekRange();
		const monthRange = getMonthRange();

		// Weekly data
		const weekNotes = await noteRepo.getAll();
		const weekNotesCreated = weekNotes.filter((n) => n.createdAt >= weekRange.start && n.createdAt <= weekRange.end);
		const weekNotesEdited = weekNotes.filter((n) => n.lastEditedAt >= weekRange.start && n.lastEditedAt <= weekRange.end);
		const weekConcepts = weekNotesCreated.filter((n) => n.noteType === 'concept');
		const weekSessions = await sessionRepo.getByDateRange(weekRange.start, weekRange.end);
		const weekTasks = await taskRepo.getByDateRange(weekRange.start, weekRange.end, 'done');
		const tagCounts = await tagRepo.getNoteCounts();
		const topTags = Array.from(tagCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([name, count]) => ({ name, count }));

		weeklyData = {
			notesCreated: weekNotesCreated.length,
			notesEdited: weekNotesEdited.length,
			conceptsAdded: weekConcepts.length,
			tasksCompleted: weekTasks.length,
			sessionsLogged: weekSessions.length,
			totalSessionMinutes: weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
			openQuestions: [],
			topTags
		};

		// Monthly data
		const monthNotes = weekNotes;
		const monthNotesCreated = monthNotes.filter((n) => n.createdAt >= monthRange.start && n.createdAt <= monthRange.end);
		const monthNotesEdited = monthNotes.filter((n) => n.lastEditedAt >= monthRange.start && n.lastEditedAt <= monthRange.end);
		const monthConcepts = monthNotesCreated.filter((n) => n.noteType === 'concept');
		const monthSessions = await sessionRepo.getByDateRange(monthRange.start, monthRange.end);
		const monthTasks = await taskRepo.getByDateRange(monthRange.start, monthRange.end, 'done');

		// Top courses by note count in period
		const courseNoteCounts = new Map<number, number>();
		for (const n of monthNotesCreated) {
			if (n.courseId) {
				courseNoteCounts.set(n.courseId, (courseNoteCounts.get(n.courseId) || 0) + 1);
			}
		}
		const topCourseIds = Array.from(courseNoteCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
		const topCourses = await Promise.all(
			topCourseIds.map(async ([id, noteCount]) => {
				const c = await courseRepo.getById(id);
				return { id, title: c?.title ?? 'Unknown', noteCount };
			})
		);

		// Most referenced notes (by backlink count)
		const links = await db.noteLinks.toArray();
		const backlinkCounts = new Map<number, number>();
		for (const l of links) {
			backlinkCounts.set(l.targetNoteId, (backlinkCounts.get(l.targetNoteId) || 0) + 1);
		}
		const topLinkedIds = Array.from(backlinkCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.filter(([_, count]) => count > 0);
		const mostReferencedNotes = await Promise.all(
			topLinkedIds.map(async ([id, linkCount]) => {
				const n = await noteRepo.getById(id);
				return { id, title: n?.title ?? 'Unknown', linkCount };
			})
		);

		// Completed modules (with course title)
		const completedMods = await moduleRepo.getCompleted();
		const completedModules = await Promise.all(
			completedMods.map(async (m) => {
				const c = await courseRepo.getById(m.courseId);
				return { courseTitle: c?.title ?? 'Unknown', moduleTitle: m.title };
			})
		);

		monthlyData = {
			notesCreated: monthNotesCreated.length,
			notesEdited: monthNotesEdited.length,
			conceptsAdded: monthConcepts.length,
			tasksCompleted: monthTasks.length,
			sessionsLogged: monthSessions.length,
			totalSessionMinutes: monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
			openQuestions: [],
			topTags,
			topCourses,
			mostReferencedNotes,
			completedModules
		};
	}

	const tabs = [
		{ id: 'weekly', label: 'Weekly' },
		{ id: 'monthly', label: 'Monthly' }
	];

	let data = $derived(activeTab === 'weekly' ? weeklyData : monthlyData);
	let monthlyDataTyped = $derived(activeTab === 'monthly' ? (monthlyData as MonthlyReviewData) : null);

	function scheduleSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveReflection(activeTab === 'weekly', reflection);
		}, 500);
	}
</script>

<div bind:this={container} class="p-6 max-w-5xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-surface-100">Review</h1>
		<Tabs
			{tabs}
			{activeTab}
			onchange={(id) => {
				saveReflection(activeTab === 'weekly', reflection);
				activeTab = id;
			}}
		/>
	</div>

	{#if data}
		<!-- Stats Grid -->
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-4 text-center">
				<NoteIcon size={20} class="text-brand-400 mx-auto mb-2" />
				<p class="text-2xl font-bold text-surface-100">{data.notesCreated}</p>
				<p class="text-xs text-surface-500 mt-0.5">Notes Created</p>
			</div>
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-4 text-center">
				<NoteIcon size={20} class="text-accent-cyan mx-auto mb-2" />
				<p class="text-2xl font-bold text-surface-100">{data.notesEdited}</p>
				<p class="text-xs text-surface-500 mt-0.5">Notes Edited</p>
			</div>
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-4 text-center">
				<LightbulbIcon size={20} class="text-accent-yellow mx-auto mb-2" />
				<p class="text-2xl font-bold text-surface-100">{data.conceptsAdded}</p>
				<p class="text-xs text-surface-500 mt-0.5">Concepts</p>
			</div>
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-4 text-center">
				<CheckCircleIcon size={20} class="text-accent-green mx-auto mb-2" />
				<p class="text-2xl font-bold text-surface-100">{data.tasksCompleted}</p>
				<p class="text-xs text-surface-500 mt-0.5">Tasks Done</p>
			</div>
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-4 text-center">
				<TimerIcon size={20} class="text-accent-purple mx-auto mb-2" />
				<p class="text-2xl font-bold text-surface-100">{data.sessionsLogged}</p>
				<p class="text-xs text-surface-500 mt-0.5">Sessions</p>
			</div>
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-4 text-center">
				<CalendarIcon size={20} class="text-accent-orange mx-auto mb-2" />
				<p class="text-2xl font-bold text-surface-100">{formatDuration(data.totalSessionMinutes)}</p>
				<p class="text-xs text-surface-500 mt-0.5">Study Time</p>
			</div>
		</div>

		<!-- Top Tags -->
		{#if data.topTags.length > 0}
			<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
				<h2 class="text-sm font-semibold text-surface-300 mb-3">Top Tags</h2>
				<div class="flex flex-wrap gap-2">
					{#each data.topTags as tag}
						<Badge label="{tag.name} ({tag.count})" variant="brand" />
					{/each}
				</div>
			</div>
		{/if}

		<!-- Monthly-only: Top Courses, Most Referenced, Completed Modules -->
		{#if monthlyDataTyped}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#if monthlyDataTyped.topCourses.length > 0}
					<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
						<h2 class="text-sm font-semibold text-surface-300 mb-3">Top Courses This Month</h2>
						<ul class="space-y-2">
							{#each monthlyDataTyped.topCourses as c}
								<li>
									<a href="/courses/{c.id}" class="text-sm text-brand-400 hover:text-brand-300">{c.title}</a>
									<span class="text-xs text-surface-500"> ({c.noteCount} notes)</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if monthlyDataTyped.mostReferencedNotes.length > 0}
					<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
						<h2 class="text-sm font-semibold text-surface-300 mb-3">Most Referenced Notes</h2>
						<ul class="space-y-2">
							{#each monthlyDataTyped.mostReferencedNotes as n}
								<li>
									<a href="/note/{n.id}" class="text-sm text-brand-400 hover:text-brand-300">{n.title}</a>
									<span class="text-xs text-surface-500"> ({n.linkCount} links)</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if monthlyDataTyped.completedModules.length > 0}
					<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
						<h2 class="text-sm font-semibold text-surface-300 mb-3">Completed Modules</h2>
						<ul class="space-y-2">
							{#each monthlyDataTyped.completedModules as m}
								<li class="text-sm text-surface-400">
									<span class="text-surface-300">{m.moduleTitle}</span>
									<span class="text-surface-600"> — {m.courseTitle}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Reflection Area -->
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-5">
			<h2 class="text-sm font-semibold text-surface-300 mb-4">Reflection</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="review-what-clicked" class="block text-xs font-medium text-surface-400 mb-1.5">What clicked this {activeTab === 'weekly' ? 'week' : 'month'}?</label>
					<textarea
						id="review-what-clicked"
						name="review-what-clicked"
						bind:value={reflection.whatClicked}
						oninput={scheduleSave}
						onblur={() => saveReflection(activeTab === 'weekly', reflection)}
						rows={3}
						placeholder="Write your reflections..."
						class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none resize-none"
					></textarea>
				</div>
				<div>
					<label for="review-what-didnt-click" class="block text-xs font-medium text-surface-400 mb-1.5">What didn't click?</label>
					<textarea
						id="review-what-didnt-click"
						name="review-what-didnt-click"
						bind:value={reflection.whatDidntClick}
						oninput={scheduleSave}
						onblur={() => saveReflection(activeTab === 'weekly', reflection)}
						rows={3}
						placeholder="Topics that need more work..."
						class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none resize-none"
					></textarea>
				</div>
				<div>
					<label for="review-what-to-revisit" class="block text-xs font-medium text-surface-400 mb-1.5">What to revisit?</label>
					<textarea
						id="review-what-to-revisit"
						name="review-what-to-revisit"
						bind:value={reflection.whatToRevisit}
						oninput={scheduleSave}
						onblur={() => saveReflection(activeTab === 'weekly', reflection)}
						rows={3}
						placeholder="Notes and concepts to review again..."
						class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none resize-none"
					></textarea>
				</div>
				<div>
					<label for="review-plan-next" class="block text-xs font-medium text-surface-400 mb-1.5">Plan for next {activeTab === 'weekly' ? 'week' : 'month'}</label>
					<textarea
						id="review-plan-next"
						name="review-plan-next"
						bind:value={reflection.planForNext}
						oninput={scheduleSave}
						onblur={() => saveReflection(activeTab === 'weekly', reflection)}
						rows={3}
						placeholder="Goals and priorities..."
						class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none resize-none"
					></textarea>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-center py-20">
			<div class="h-6 w-6 animate-spin rounded-full border-2 border-surface-700 border-t-brand-500"></div>
		</div>
	{/if}
</div>
