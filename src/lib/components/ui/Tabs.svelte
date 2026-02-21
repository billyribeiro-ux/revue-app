<script lang="ts">
	interface Tab {
		id: string;
		label: string;
		icon?: any;
	}

	interface Props {
		tabs: Tab[];
		activeTab: string;
		onchange: (id: string) => void;
	}

	let { tabs, activeTab, onchange }: Props = $props();
</script>

<div class="flex items-center gap-1 rounded-lg bg-surface-900 p-1 border border-surface-800">
	{#each tabs as tab}
		<button
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
