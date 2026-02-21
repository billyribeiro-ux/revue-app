<script lang="ts">
	interface Props {
		variant?: 'default' | 'brand' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
		size?: 'sm' | 'md';
		class?: string;
		label: string;
		onclick?: () => void;
		removable?: boolean;
		onremove?: () => void;
	}

	let {
		variant = 'default',
		size = 'sm',
		class: className = '',
		label,
		onclick,
		removable = false,
		onremove
	}: Props = $props();

	const variantClasses = {
		default: 'bg-surface-800 text-surface-300 border-surface-700',
		brand: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
		green: 'bg-accent-green/15 text-accent-green border-accent-green/30',
		yellow: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
		red: 'bg-accent-red/15 text-accent-red border-accent-red/30',
		purple: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
		cyan: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
	};

	const sizeClasses = {
		sm: 'text-xs px-2 py-0.5',
		md: 'text-sm px-2.5 py-1'
	};
</script>

{#if onclick}
	<div class="inline-flex items-center gap-1 rounded-md border font-medium {variantClasses[variant]} {sizeClasses[size]} cursor-pointer hover:opacity-80 {className}" role="group">
		<button type="button" class="flex-1 min-w-0 text-left border-0 bg-transparent p-0 m-0 font-inherit cursor-pointer" onclick={onclick}>
			{label}
		</button>
		{#if removable && onremove}
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); onremove?.(); }}
				class="ml-0.5 rounded-sm hover:bg-white/10 p-0.5 leading-none border-0 bg-transparent cursor-pointer"
				aria-label="Remove"
			>
				&times;
			</button>
		{/if}
	</div>
{:else}
	<span class="inline-flex items-center gap-1 rounded-md border font-medium {variantClasses[variant]} {sizeClasses[size]} {className}">
		{label}
		{#if removable && onremove}
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); onremove?.(); }}
				class="ml-0.5 rounded-sm hover:bg-white/10 p-0.5 leading-none border-0 bg-transparent cursor-pointer"
				aria-label="Remove"
			>
				&times;
			</button>
		{/if}
	</span>
{/if}
