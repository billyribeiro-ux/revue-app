<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { initializeDatabase } from '$lib/db';
	import { initSearchIndex } from '$lib/db/search';
	import { handleKeydown, registerShortcut } from '$lib/utils/keyboard';
	import { goto } from '$app/navigation';
	import { openCommandPalette } from '$lib/stores/command-palette.svelte';
	import { setActiveSession, addToast, setDbReady } from '$lib/stores/app.svelte';
	import { noteRepo } from '$lib/db/repositories/note';
	import { sessionRepo } from '$lib/db/repositories/session';

	let { children }: { children: Snippet } = $props();
	let ready = $state(false);

	$effect(() => {
		init();
	});

	async function init() {
		await initializeDatabase();
		setDbReady(true);
		await initSearchIndex();

		// Register global keyboard shortcuts
		registerShortcut({
			key: 'k',
			ctrl: true,
			handler: () => openCommandPalette(),
			description: 'Open command palette'
		});

		registerShortcut({
			key: 'n',
			ctrl: true,
			handler: async () => {
				const id = await noteRepo.create({ title: 'Untitled Note' });
				goto(`/note/${id}`);
			},
			description: 'Create new note'
		});

		registerShortcut({
			key: '/',
			ctrl: true,
			handler: () => openCommandPalette(),
			description: 'Search'
		});

		registerShortcut({
			key: 's',
			ctrl: true,
			shift: true,
			handler: async () => {
				const id = await sessionRepo.create({});
				setActiveSession(id);
				addToast('success', 'Study session started');
			},
			description: 'Start study session'
		});

		ready = true;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if ready}
	<AppShell>
		{@render children()}
	</AppShell>
{:else}
	<div class="flex h-screen items-center justify-center bg-surface-950">
		<div class="flex flex-col items-center gap-3">
			<div class="h-8 w-8 animate-spin rounded-full border-2 border-surface-700 border-t-brand-500"></div>
			<p class="text-sm text-surface-500">Loading NotesOS...</p>
		</div>
	</div>
{/if}
