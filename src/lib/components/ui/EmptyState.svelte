<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		icon?: any;
		action?: Snippet;
	}

	let { title, description, icon, action }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
	{#if icon}
		{@const EmptyIcon = icon}
		<EmptyIcon size={48} class="text-surface-600 mb-4" weight="duotone" />
	{/if}
	<h3 class="text-lg font-medium text-surface-300">{title}</h3>
	<p class="mt-1 text-sm text-surface-500 max-w-sm">{description}</p>
	{#if action}
		<div class="mt-4">
			{@render action()}
		</div>
	{/if}
</div>
