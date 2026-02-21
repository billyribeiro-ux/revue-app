<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		text: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		children: Snippet;
	}

	let { text, position = 'top', children }: Props = $props();

	const positionClasses = {
		top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 -translate-y-1/2 ml-2'
	};
</script>

<div class="group relative inline-flex">
	{@render children()}
	<div
		class="pointer-events-none absolute {positionClasses[position]} z-50 whitespace-nowrap rounded-md bg-surface-800 px-2.5 py-1.5 text-xs text-surface-200 opacity-0 shadow-lg border border-surface-700 transition-opacity group-hover:opacity-100"
	>
		{text}
	</div>
</div>
