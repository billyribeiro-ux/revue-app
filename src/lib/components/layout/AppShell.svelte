<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getAppState } from '$lib/stores/app.svelte';
	import Sidebar from './Sidebar.svelte';
	import TopBar from './TopBar.svelte';
	import CommandPalette from './CommandPalette.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import gsap from 'gsap';

	interface Props {
		children: Snippet;
		title?: string;
	}

	let { children, title = '' }: Props = $props();

	let appState = $derived(getAppState());
	let mainContent: HTMLElement | undefined;

	// Animate sidebar collapse/expand
	let sidebarEl: HTMLElement | undefined;

	$effect(() => {
		if (sidebarEl) {
			if (appState.sidebarOpen) {
				gsap.to(sidebarEl, { width: 256, opacity: 1, duration: 0.25, ease: 'power2.out' });
			} else {
				gsap.to(sidebarEl, { width: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
			}
		}
	});
</script>

<div class="flex h-screen overflow-hidden bg-surface-950">
	<!-- Sidebar -->
	<div bind:this={sidebarEl} class="shrink-0 overflow-hidden" style="width: {appState.sidebarOpen ? '256px' : '0'}">
		<Sidebar />
	</div>

	<!-- Main content area -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<TopBar {title} />
		<main bind:this={mainContent} class="flex-1 overflow-y-auto">
			{#if appState.focusMode}
				<div class="mx-auto max-w-3xl p-6">
					{@render children()}
				</div>
			{:else}
				{@render children()}
			{/if}
		</main>
	</div>
</div>

<!-- Global overlays -->
<CommandPalette />
<Toast />
