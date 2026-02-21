<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		size?: 'sm' | 'md';
		color?: 'brand' | 'green' | 'yellow' | 'red';
		showLabel?: boolean;
	}

	let { value, max = 100, size = 'sm', color = 'brand', showLabel = false }: Props = $props();

	const pct = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

	const colorClasses = {
		brand: 'bg-brand-500',
		green: 'bg-accent-green',
		yellow: 'bg-accent-yellow',
		red: 'bg-accent-red'
	};

	const sizeClasses = {
		sm: 'h-1.5',
		md: 'h-2.5'
	};
</script>

<div class="flex items-center gap-2">
	<div class="flex-1 rounded-full bg-surface-800 {sizeClasses[size]} overflow-hidden">
		<div
			class="rounded-full {colorClasses[color]} {sizeClasses[size]} transition-all duration-500"
			style="width: {pct}%"
		></div>
	</div>
	{#if showLabel}
		<span class="text-xs text-surface-400 tabular-nums">{Math.round(pct)}%</span>
	{/if}
</div>
