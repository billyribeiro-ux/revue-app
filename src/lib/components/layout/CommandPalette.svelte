<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		MagnifyingGlassIcon,
		NoteIcon,
		BookOpenIcon,
		TimerIcon,
		CheckSquareIcon,
		DownloadIcon,
		GearIcon,
		HouseIcon
	} from 'phosphor-svelte';
	import {
		getCommandPaletteState,
		closeCommandPalette,
		setSearchQuery,
		getFilteredCommands,
		registerCommands
	} from '$lib/stores/command-palette.svelte';
	import { setActiveSession } from '$lib/stores/app.svelte';
	import { noteRepo } from '$lib/db/repositories/note';
	import { courseRepo } from '$lib/db/repositories/course';
	import { sessionRepo } from '$lib/db/repositories/session';
	import { search } from '$lib/db/search';
	import type { SearchResult, Command } from '$lib/types';
	import gsap from 'gsap';

	let paletteState = $derived(getCommandPaletteState());
	let input: HTMLInputElement | undefined;
	let panel: HTMLElement | undefined;
	let selectedIndex = $state(0);
	let searchResults = $state<SearchResult[]>([]);

	// Register default commands
	$effect(() => {
		registerCommands([
			{
				id: 'new-note',
				label: 'New Note',
				description: 'Create a new note',
				icon: 'Note',
				shortcut: 'Ctrl+N',
				action: () => createNewNote(),
				category: 'create'
			},
			{
				id: 'new-course',
				label: 'New Course',
				description: 'Create a new course or topic',
				icon: 'BookOpen',
				action: () => goto('/courses?new=true'),
				category: 'create'
			},
			{
				id: 'start-session',
				label: 'Start Session',
				description: 'Start a study session timer',
				icon: 'Timer',
				shortcut: 'Ctrl+Shift+S',
				action: () => startSession(),
				category: 'create'
			},
			{
				id: 'go-today',
				label: 'Go to Today',
				description: 'Navigate to Today view',
				icon: 'House',
				action: () => goto('/'),
				category: 'navigation'
			},
			{
				id: 'go-courses',
				label: 'Go to Courses',
				description: 'Navigate to Courses',
				icon: 'BookOpen',
				action: () => goto('/courses'),
				category: 'navigation'
			},
			{
				id: 'go-library',
				label: 'Go to Library',
				description: 'Navigate to Library',
				icon: 'Books',
				action: () => goto('/library'),
				category: 'navigation'
			},
			{
				id: 'go-review',
				label: 'Go to Review',
				description: 'Navigate to Review',
				icon: 'ChartBar',
				action: () => goto('/review'),
				category: 'navigation'
			},
			{
				id: 'go-settings',
				label: 'Go to Settings',
				description: 'Navigate to Settings',
				icon: 'Gear',
				action: () => goto('/settings'),
				category: 'settings'
			}
		]);
	});

	$effect(() => {
		if (paletteState.isOpen && input) {
			setTimeout(() => input?.focus(), 50);
		}
	});

	$effect(() => {
		if (paletteState.isOpen && panel) {
			gsap.fromTo(panel, { opacity: 0, y: -10, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' });
		}
	});

	// Search when query changes
	$effect(() => {
		if (paletteState.searchQuery && paletteState.searchQuery.length > 1) {
			doSearch(paletteState.searchQuery);
		} else {
			searchResults = [];
		}
	});

	async function doSearch(query: string) {
		searchResults = await search(query);
	}

	async function createNewNote() {
		const id = await noteRepo.create({ title: 'Untitled Note' });
		goto(`/note/${id}`);
		closeCommandPalette();
	}

	async function startSession() {
		const id = await sessionRepo.create({});
		setActiveSession(id);
		closeCommandPalette();
	}

	let displayItems = $derived(() => {
		if (paletteState.searchQuery && searchResults.length > 0) {
			return searchResults.map((r) => ({
				id: `search-${r.type}-${r.id}`,
				label: r.title,
				description: r.subtitle,
				category: r.type,
				action: () => {
					if (r.type === 'note') goto(`/note/${r.id}`);
					else if (r.type === 'course') goto(`/courses/${r.id}`);
					closeCommandPalette();
				}
			}));
		}
		return getFilteredCommands().map((c) => ({
			id: c.id,
			label: c.label,
			description: c.description,
			category: c.category,
			action: () => { c.action(); closeCommandPalette(); }
		}));
	});

	function handleKeydown(e: KeyboardEvent) {
		const items = displayItems();
		if (e.key === 'Escape') {
			closeCommandPalette();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (items[selectedIndex]) {
				items[selectedIndex].action();
			}
		}
	}

	$effect(() => {
		selectedIndex = 0;
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			e.preventDefault();
			if (paletteState.isOpen) closeCommandPalette();
			else openCommandPalette();
		}
	}}
/>

{#if paletteState.isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh]"
		onclick={closeCommandPalette}
	>
		<div
			bind:this={panel}
			class="w-full max-w-xl rounded-xl border border-surface-700 bg-surface-900 shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			onkeydown={handleKeydown}
		>
			<!-- Search input -->
			<div class="flex items-center gap-3 border-b border-surface-700 px-4 py-3">
				<MagnifyingGlassIcon size={20} class="text-surface-500 shrink-0" />
				<input
					bind:this={input}
					type="text"
					placeholder="Search or type a command..."
					value={paletteState.searchQuery}
					oninput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
					class="flex-1 bg-transparent text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none"
				/>
				<kbd class="rounded border border-surface-700 bg-surface-800 px-1.5 py-0.5 text-xs text-surface-500">ESC</kbd>
			</div>

			<!-- Results -->
			<div class="max-h-80 overflow-y-auto py-2">
				{#each displayItems() as item, i}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors
							{i === selectedIndex ? 'bg-surface-800' : 'hover:bg-surface-800/50'}"
						onclick={item.action}
						onmouseenter={() => (selectedIndex = i)}
					>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-surface-200 truncate">{item.label}</div>
							<div class="text-xs text-surface-500 truncate">{item.description}</div>
						</div>
						<span class="text-xs text-surface-600 capitalize shrink-0">{item.category}</span>
					</div>
				{/each}
				{#if displayItems().length === 0}
					<div class="px-4 py-8 text-center text-sm text-surface-500">
						No results found
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
