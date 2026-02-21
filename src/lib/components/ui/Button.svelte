<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit';
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'secondary',
		size = 'md',
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500/50';

	const variantClasses = {
		primary: 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700',
		secondary: 'bg-surface-800 text-surface-200 hover:bg-surface-700 active:bg-surface-800 border border-surface-700',
		ghost: 'text-surface-400 hover:text-surface-200 hover:bg-surface-800',
		danger: 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border border-accent-red/30'
	};

	const sizeClasses = {
		sm: 'text-xs px-2.5 py-1.5',
		md: 'text-sm px-3.5 py-2',
		lg: 'text-base px-5 py-2.5'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
>
	{@render children()}
</button>
