<script lang="ts">
	import {
		GearIcon,
		DownloadIcon,
		UploadIcon,
		TagIcon,
		TrashIcon,
		DatabaseIcon,
		KeyboardIcon,
		InfoIcon
	} from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { createBackup, restoreFromBackup, restoreFromDialog } from '$lib/utils/backup';
	import { isTauri } from '$lib/utils/platform';
	import { exportAllToJson, downloadFile } from '$lib/utils/export';
	import { tagRepo } from '$lib/db/repositories/tag';
	import { noteRepo } from '$lib/db/repositories/note';
	import { courseRepo } from '$lib/db/repositories/course';
	import { addToast } from '$lib/stores/app.svelte';
	import { getShortcuts } from '$lib/utils/keyboard';
	import type { Tag } from '$lib/types';

	let tags = $state<Tag[]>([]);
	let tagCounts = $state(new Map<string, number>());
	let unusedTags = $state<Tag[]>([]);
	let totalNotes = $state(0);
	let totalCourses = $state(0);
	let showClearConfirm = $state(false);
	let fileInput: HTMLInputElement | undefined;

	$effect(() => {
		loadData();
	});

	async function loadData() {
		tags = await tagRepo.getAll();
		tagCounts = await tagRepo.getNoteCounts();
		unusedTags = await tagRepo.getUnused();
		totalNotes = await noteRepo.count();
		totalCourses = (await courseRepo.getAll()).length;
	}

	async function handleBackup() {
		await createBackup();
		addToast('success', 'Backup downloaded');
	}

	async function handleRestore() {
		if (isTauri()) {
			// Use native file dialog in desktop mode
			const result = await restoreFromDialog();
			if (result.success) {
				addToast('success', result.message);
				await loadData();
			} else if (result.message !== 'No file selected') {
				addToast('error', result.message);
			}
		} else {
			fileInput?.click();
		}
	}

	async function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;
		const result = await restoreFromBackup(input.files[0]);
		if (result.success) {
			addToast('success', result.message);
			await loadData();
		} else {
			addToast('error', result.message);
		}
	}

	async function handleExportMarkdown() {
		const json = await exportAllToJson();
		downloadFile(json, `notesos-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
		addToast('success', 'Full export downloaded');
	}

	async function removeUnusedTags() {
		for (const tag of unusedTags) {
			if (tag.id) await tagRepo.remove(tag.id);
		}
		addToast('success', `Removed ${unusedTags.length} unused tags`);
		await loadData();
	}

	async function deleteTag(id: number) {
		await tagRepo.remove(id);
		addToast('info', 'Tag deleted');
		await loadData();
	}

	const shortcuts = getShortcuts();
</script>

<input bind:this={fileInput} type="file" accept=".json" onchange={handleFileSelected} class="hidden" />

<div class="p-6 max-w-4xl mx-auto space-y-8">
	<h1 class="text-2xl font-bold text-surface-100">Settings</h1>

	<!-- Database Info -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-5">
		<h2 class="text-base font-semibold text-surface-200 mb-4 flex items-center gap-2">
			<DatabaseIcon size={18} />
			Database
		</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
			<div>
				<span class="text-surface-500">Total Notes</span>
				<p class="text-lg font-bold text-surface-200">{totalNotes}</p>
			</div>
			<div>
				<span class="text-surface-500">Total Courses</span>
				<p class="text-lg font-bold text-surface-200">{totalCourses}</p>
			</div>
			<div>
				<span class="text-surface-500">Total Tags</span>
				<p class="text-lg font-bold text-surface-200">{tags.length}</p>
			</div>
			<div>
				<span class="text-surface-500">Unused Tags</span>
				<p class="text-lg font-bold text-surface-200">{unusedTags.length}</p>
			</div>
		</div>
	</section>

	<!-- Backup & Export -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-5">
		<h2 class="text-base font-semibold text-surface-200 mb-4 flex items-center gap-2">
			<DownloadIcon size={18} />
			Backup & Export
		</h2>
		<div class="flex flex-wrap gap-3">
			<Button variant="secondary" onclick={handleBackup}>
				<DownloadIcon size={16} />
				Download Backup
			</Button>
			<Button variant="secondary" onclick={handleRestore}>
				<UploadIcon size={16} />
				Restore from Backup
			</Button>
			<Button variant="secondary" onclick={handleExportMarkdown}>
				<DownloadIcon size={16} />
				Export All (JSON)
			</Button>
		</div>
		<p class="text-xs text-surface-500 mt-3">
			Backups include all workspaces, courses, notes, sessions, tasks, and tags.
		</p>
	</section>

	<!-- Tag Management -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-5">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-base font-semibold text-surface-200 flex items-center gap-2">
				<TagIcon size={18} />
				Tag Management
			</h2>
			{#if unusedTags.length > 0}
				<Button size="sm" variant="ghost" onclick={removeUnusedTags}>
					<TrashIcon size={14} />
					Remove {unusedTags.length} unused
				</Button>
			{/if}
		</div>
		{#if tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each tags as tag}
					<div class="flex items-center gap-1 rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-sm">
						<span class="text-surface-300">{tag.name}</span>
						<span class="text-xs text-surface-500">({tagCounts.get(tag.name) || 0})</span>
						<button
							onclick={() => deleteTag(tag.id!)}
							class="ml-1 rounded p-0.5 text-surface-500 hover:text-accent-red transition-colors"
						>
							&times;
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-surface-500 italic">No tags created yet</p>
		{/if}
	</section>

	<!-- Keyboard Shortcuts -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-5">
		<h2 class="text-base font-semibold text-surface-200 mb-4 flex items-center gap-2">
			<KeyboardIcon size={18} />
			Keyboard Shortcuts
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
			{#each shortcuts as shortcut}
				<div class="flex items-center justify-between py-1.5">
					<span class="text-sm text-surface-400">{shortcut.description}</span>
					<kbd class="rounded border border-surface-700 bg-surface-800 px-2 py-0.5 text-xs text-surface-300 font-mono">
						{shortcut.display}
					</kbd>
				</div>
			{/each}
		</div>
	</section>

	<!-- About -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-5">
		<h2 class="text-base font-semibold text-surface-200 mb-2 flex items-center gap-2">
			<InfoIcon size={18} />
			About
		</h2>
		<p class="text-sm text-surface-400">NotesOS — A professional-grade learning operating system</p>
		<p class="text-xs text-surface-500 mt-1">Local-first. All data stored locally. Works on macOS, Windows, and the web.</p>
	</section>
</div>
