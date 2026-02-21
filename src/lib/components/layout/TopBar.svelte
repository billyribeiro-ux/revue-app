<script lang="ts">
	import {
		ListIcon,
		MagnifyingGlassIcon,
		CommandIcon,
		SidebarIcon,
		TimerIcon
	} from 'phosphor-svelte';
	import {
		getAppState,
		toggleSidebar,
		toggleCommandPalette
	} from '$lib/stores/app.svelte';
	import { openCommandPalette } from '$lib/stores/command-palette.svelte';
	import { sessionRepo } from '$lib/db/repositories/session';
	import { formatDuration, getDurationMinutes } from '$lib/utils/date';
	import type { Session } from '$lib/types';

	interface Props {
		title?: string;
	}

	let { title = '' }: Props = $props();

	let appState = $derived(getAppState());
	let activeSession = $state<Session | null>(null);
	let sessionElapsed = $state('');

	$effect(() => {
		checkActiveSession();
		const interval = setInterval(updateSessionTimer, 1000);
		return () => clearInterval(interval);
	});

	async function checkActiveSession() {
		if (appState.activeSessionId) {
			const session = await sessionRepo.getById(appState.activeSessionId);
			activeSession = session || null;
		} else {
			activeSession = null;
		}
	}

	function updateSessionTimer() {
		if (activeSession) {
			const minutes = getDurationMinutes(activeSession.startTime, Date.now());
			sessionElapsed = formatDuration(minutes);
		}
	}
</script>

<header class="flex h-14 items-center justify-between border-b border-surface-800 bg-surface-950 px-4">
	<div class="flex items-center gap-3">
		<button
			onclick={toggleSidebar}
			class="rounded-lg p-2 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors lg:hidden"
		>
			<ListIcon size={20} />
		</button>

		{#if title}
			<h1 class="text-lg font-semibold text-surface-100">{title}</h1>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<!-- Active session indicator -->
		{#if activeSession}
			<div class="flex items-center gap-2 rounded-lg bg-accent-green/10 border border-accent-green/30 px-3 py-1.5">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-accent-green"></span>
				</span>
				<TimerIcon size={16} class="text-accent-green" />
				<span class="text-sm font-medium text-accent-green tabular-nums">{sessionElapsed}</span>
			</div>
		{/if}

		<!-- Search trigger -->
		<button
			onclick={() => { toggleCommandPalette(); openCommandPalette(); }}
			class="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-900 px-3 py-1.5 text-sm text-surface-500 hover:border-surface-600 hover:text-surface-300 transition-colors"
		>
			<MagnifyingGlassIcon size={16} />
			<span class="hidden sm:inline">Search...</span>
			<kbd class="hidden sm:inline-flex items-center rounded border border-surface-700 bg-surface-800 px-1.5 py-0.5 text-xs text-surface-500">
				<CommandIcon size={10} class="mr-0.5" />K
			</kbd>
		</button>
	</div>
</header>
