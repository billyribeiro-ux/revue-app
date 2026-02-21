<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import {
		ArrowLeftIcon,
		StarIcon,
		PushPinIcon,
		ClockCounterClockwiseIcon,
		DotsThreeIcon,
		TagIcon,
		BookOpenIcon,
		EyeIcon,
		FloppyDiskIcon
	} from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import NoteEditor from '$lib/components/editor/NoteEditor.svelte';
	import { noteRepo } from '$lib/db/repositories/note';
	import { courseRepo } from '$lib/db/repositories/course';
	import { indexNote } from '$lib/db/search';
	import { addToast, getAppState, setActiveSession } from '$lib/stores/app.svelte';
	import { sessionRepo } from '$lib/db/repositories/session';
	import { formatTimeAgo, formatDate } from '$lib/utils/date';
	import { noteToMarkdown, downloadFile } from '$lib/utils/export';
	import type { Note, Course, NoteVersion } from '$lib/types';

	let noteId = $derived(Number(page.params.id));
	let note = $state<Note | null>(null);
	let course = $state<Course | null>(null);
	let versions = $state<NoteVersion[]>([]);
	let showDeleteConfirm = $state(false);
	let showVersions = $state(false);
	let titleInput: HTMLInputElement | undefined;
	let saveTimeout: ReturnType<typeof setTimeout> | undefined;
	let lastSaved = $state<number>(0);
	let saving = $state(false);

	let appState = $derived(getAppState());

	$effect(() => {
		loadNote(noteId);
	});

	async function loadNote(id: number) {
		note = (await noteRepo.getById(id)) || null;
		if (note?.courseId) {
			course = (await courseRepo.getById(note.courseId)) || null;
		}
		if (note) {
			lastSaved = note.updatedAt;
		}
	}

	async function saveNote() {
		if (!note?.id) return;
		saving = true;
		await noteRepo.update(note.id, {
			title: note.title,
			body: note.body,
			tags: note.tags
		});

		// Update search index
		const updated = await noteRepo.getById(note.id);
		if (updated) {
			indexNote({
				id: updated.id!,
				title: updated.title,
				bodyPlaintext: updated.bodyPlaintext,
				noteType: updated.noteType,
				tags: updated.tags,
				courseId: updated.courseId
			});
		}

		// Track in active session
		if (appState.activeSessionId) {
			await sessionRepo.addLinkedNote(appState.activeSessionId, note.id);
		}

		lastSaved = Date.now();
		saving = false;
	}

	function debouncedSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveNote, 1000);
	}

	function handleBodyUpdate(html: string) {
		if (note) {
			note.body = html;
			debouncedSave();
		}
	}

	function handleTitleInput() {
		debouncedSave();
	}

	async function togglePin() {
		if (!note?.id) return;
		await noteRepo.togglePin(note.id);
		note.pinned = !note.pinned;
		addToast('info', note.pinned ? 'Note pinned' : 'Note unpinned');
	}

	async function toggleFavorite() {
		if (!note?.id) return;
		await noteRepo.toggleFavorite(note.id);
		note.favorited = !note.favorited;
		addToast('info', note.favorited ? 'Added to favorites' : 'Removed from favorites');
	}

	async function saveVersion() {
		if (!note?.id) return;
		await noteRepo.saveVersion(note.id);
		addToast('success', 'Version saved');
		versions = await noteRepo.getVersions(note.id);
	}

	async function loadVersions() {
		if (!note?.id) return;
		versions = await noteRepo.getVersions(note.id);
		showVersions = true;
	}

	async function restoreVersion(versionId: number) {
		if (!note?.id) return;
		await noteRepo.restoreVersion(note.id, versionId);
		await loadNote(noteId);
		showVersions = false;
		addToast('success', 'Version restored');
	}

	async function deleteNote() {
		if (!note?.id) return;
		await noteRepo.remove(note.id);
		addToast('success', 'Note deleted');
		if (course) {
			goto(`/courses/${course.id}`);
		} else {
			goto('/library');
		}
	}

	function exportAsMarkdown() {
		if (!note) return;
		const md = noteToMarkdown(note);
		downloadFile(md, `${note.title}.md`, 'text/markdown');
		addToast('success', 'Note exported');
	}
</script>

{#if note}
	<div class="flex flex-col h-full">
		<!-- Top bar -->
		<div class="flex items-center justify-between border-b border-surface-800 px-4 py-2">
			<div class="flex items-center gap-3">
				{#if course}
					<a
						href="/courses/{course.id}"
						class="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-300"
					>
						<ArrowLeftIcon size={14} />
						<BookOpenIcon size={14} />
						{course.title}
					</a>
				{:else}
					<a
						href="/library"
						class="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-300"
					>
						<ArrowLeftIcon size={14} />
						Library
					</a>
				{/if}
				<Badge label={note.noteType} variant="brand" size="sm" />
			</div>

			<div class="flex items-center gap-1">
				<!-- Save indicator -->
				<span class="text-xs text-surface-600 mr-2">
					{#if saving}
						Saving...
					{:else if lastSaved}
						Saved {formatTimeAgo(lastSaved)}
					{/if}
				</span>

				<button
					onclick={toggleFavorite}
					class="rounded-lg p-2 transition-colors {note.favorited ? 'text-accent-yellow' : 'text-surface-400 hover:text-surface-200'} hover:bg-surface-800"
					title="Favorite"
				>
					<StarIcon size={16} weight={note.favorited ? 'fill' : 'regular'} />
				</button>
				<button
					onclick={togglePin}
					class="rounded-lg p-2 transition-colors {note.pinned ? 'text-brand-400' : 'text-surface-400 hover:text-surface-200'} hover:bg-surface-800"
					title="Pin"
				>
					<PushPinIcon size={16} weight={note.pinned ? 'fill' : 'regular'} />
				</button>

				<Dropdown
					align="right"
					items={[
						{ label: 'Save Version', onclick: saveVersion },
						{ label: 'View History', onclick: loadVersions },
						{ label: 'Export as Markdown', onclick: exportAsMarkdown },
						{ label: 'Delete Note', onclick: () => (showDeleteConfirm = true), variant: 'danger' }
					]}
				>
					{#snippet trigger()}
						<button class="rounded-lg p-2 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors">
							<DotsThreeIcon size={18} weight="bold" />
						</button>
					{/snippet}
				</Dropdown>
			</div>
		</div>

		<!-- Title -->
		<div class="px-6 pt-6 pb-2">
			<input
				bind:this={titleInput}
				bind:value={note.title}
				oninput={handleTitleInput}
				placeholder="Note title..."
				class="w-full bg-transparent text-2xl font-bold text-surface-100 placeholder:text-surface-600 focus:outline-none"
			/>
			<div class="flex items-center gap-2 mt-2">
				{#each note.tags as tag}
					<Badge label={tag} size="sm" variant="brand" />
				{/each}
				<span class="text-xs text-surface-600">Created {formatDate(note.createdAt)}</span>
			</div>
		</div>

		<!-- Editor -->
		<div class="flex-1 px-6 pb-6 overflow-hidden">
			<NoteEditor content={note.body} onupdate={handleBodyUpdate} />
		</div>
	</div>

	<!-- Version History Panel -->
	{#if showVersions}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-end bg-black/40"
			onclick={() => (showVersions = false)}
		>
			<div
				class="h-full w-80 bg-surface-900 border-l border-surface-700 p-5 overflow-y-auto"
				onclick={(e) => e.stopPropagation()}
			>
				<h2 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
					<ClockCounterClockwiseIcon size={20} />
					Version History
				</h2>
				{#if versions.length > 0}
					<div class="space-y-3">
						{#each versions as version}
							<div class="rounded-lg border border-surface-700 p-3">
								<p class="text-sm font-medium text-surface-200">{version.title}</p>
								<p class="text-xs text-surface-500 mt-1">{formatTimeAgo(version.createdAt)}</p>
								<div class="mt-2 flex gap-2">
									<Button
										size="sm"
										variant="ghost"
										onclick={() => restoreVersion(version.id!)}
									>
										Restore
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-surface-500">No saved versions yet. Use "Save Version" to create snapshots.</p>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div class="flex h-full items-center justify-center">
		<p class="text-surface-500">Note not found</p>
	</div>
{/if}

<ConfirmDialog
	bind:open={showDeleteConfirm}
	title="Delete Note"
	message="This will permanently delete this note and all its versions. This action cannot be undone."
	confirmLabel="Delete Note"
	confirmVariant="danger"
	onconfirm={deleteNote}
	oncancel={() => (showDeleteConfirm = false)}
/>
