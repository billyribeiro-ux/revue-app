<script lang="ts">
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import {
		TrayIcon,
		PlusIcon,
		ArrowRightIcon,
		NoteIcon,
		TrashIcon
	} from 'phosphor-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { noteRepo } from '$lib/db/repositories/note';
	import { inboxRepo } from '$lib/db/repositories/inbox';
	import { courseRepo } from '$lib/db/repositories/course';
	import { addToast, getAppState, isDbReady } from '$lib/stores/app.svelte';
	import { formatTimeAgo } from '$lib/utils/date';
	import { noteTemplates } from '$lib/templates';
	import type { InboxItem, Course, NoteType } from '$lib/types';

	let items = $state<InboxItem[]>([]);
	let courses = $state<Course[]>([]);
	let newContent = $state('');
	let appState = $derived(getAppState());

	let container: HTMLElement | undefined;

	$effect(() => {
		if (isDbReady()) loadData();
	});

	$effect(() => {
		if (container) {
			gsap.fromTo(
				container.children,
				{ opacity: 0, y: 15 },
				{ opacity: 1, y: 0, stagger: 0.03, duration: 0.3, ease: 'power2.out' }
			);
		}
	});

	async function loadData() {
		items = await inboxRepo.getAll();
		courses = await courseRepo.getAll(appState.activeWorkspaceId ?? undefined);
	}

	async function quickCapture() {
		if (!newContent.trim()) return;
		await inboxRepo.create({
			content: newContent.trim(),
			tags: [],
			courseId: null
		});
		newContent = '';
		addToast('success', 'Captured to inbox');
		await loadData();
	}

	async function convertToNote(item: InboxItem, type: NoteType = 'general') {
		const template = noteTemplates.find((t) => t.type === type);
		const id = await noteRepo.create({
			title: item.content.substring(0, 60),
			noteType: type,
			body: template?.defaultBody ? `<p>${item.content}</p>${template.defaultBody}` : `<p>${item.content}</p>`,
			courseId: item.courseId,
			workspaceId: appState.activeWorkspaceId,
			tags: item.tags
		});
		await inboxRepo.remove(item.id!);
		await loadData();
		goto(`/note/${id}`);
	}

	async function deleteItem(id: number) {
		await inboxRepo.remove(id);
		await loadData();
		addToast('info', 'Item removed from inbox');
	}
</script>

<div bind:this={container} class="p-6 max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-surface-100">Inbox</h1>
		<p class="text-sm text-surface-500 mt-0.5">Capture thoughts quickly and organize them later</p>
	</div>

	<!-- Quick capture -->
	<div class="flex gap-3">
		<input
			id="inbox-quick-capture"
			name="inbox-content"
			bind:value={newContent}
			placeholder="Quick capture — type anything..."
			onkeydown={(e) => { if (e.key === 'Enter') quickCapture(); }}
			class="flex-1 rounded-lg border border-surface-700 bg-surface-900 px-4 py-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
		/>
		<Button variant="primary" onclick={quickCapture}>
			<PlusIcon size={16} />
			Capture
		</Button>
	</div>

	<!-- Inbox items -->
	{#if items.length > 0}
		<div class="space-y-3">
			{#each items as item}
				<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
					<div class="flex items-start justify-between">
						<p class="text-sm text-surface-200 flex-1">{item.content}</p>
						<button
							onclick={() => deleteItem(item.id!)}
							class="ml-3 rounded p-1 text-surface-500 hover:text-accent-red hover:bg-accent-red/10 transition-colors shrink-0"
						>
							<TrashIcon size={14} />
						</button>
					</div>
					<div class="flex items-center justify-between mt-3">
						<span class="text-xs text-surface-600">{formatTimeAgo(item.createdAt)}</span>
						<div class="flex items-center gap-2">
							<Select
								id="inbox-convert-{item.id}"
								name="inbox-convert"
								placeholder="Convert to..."
								options={noteTemplates.map((t) => ({ value: t.type, label: t.label }))}
								onchange={(val) => convertToNote(item, val as NoteType)}
								class="w-40 text-xs"
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<EmptyState
			title="Inbox is empty"
			description="Use the quick capture above to jot down thoughts, then organize them into notes"
			icon={TrayIcon}
		/>
	{/if}
</div>
