<script lang="ts">
	import type { Component } from 'svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: Component<Record<string, unknown>>;
	}

	interface Props {
		tabs: Tab[];
		activeTab: string;
		onchange: (id: string) => void;
	}

	let { tabs, activeTab, onchange }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		const currentIndex = tabs.findIndex((t) => t.id === activeTab);
		if (currentIndex === -1) return;

		let nextIndex = -1;
		if (e.key === 'ArrowRight') {
			nextIndex = (currentIndex + 1) % tabs.length;
		} else if (e.key === 'ArrowLeft') {
			nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		} else if (e.key === 'Home') {
			nextIndex = 0;
		} else if (e.key === 'End') {
			nextIndex = tabs.length - 1;
		}

		if (nextIndex >= 0) {
			e.preventDefault();
			onchange(tabs[nextIndex].id);
			const target = (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
			target?.focus();
		}
	}
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div role="tablist" class="flex items-center gap-1 rounded-lg bg-surface-900 p-1 border border-surface-800" onkeydown={handleKeydown}>
	{#each tabs as tab}
		<button
			role="tab"
			aria-selected={activeTab === tab.id}
			tabindex={activeTab === tab.id ? 0 : -1}
			onclick={() => onchange(tab.id)}
			class="relative rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150
				{activeTab === tab.id
					? 'bg-surface-700 text-surface-100 shadow-sm'
					: 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'}"
		>
			{tab.label}
		</button>
	{/each}
</div>
