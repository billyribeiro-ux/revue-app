<script lang="ts">
	import type { Snippet } from 'svelte';
	import gsap from 'gsap';
	import { XIcon } from 'phosphor-svelte';

	interface Props {
		open: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title = '',
		size = 'md',
		onclose,
		children,
		footer
	}: Props = $props();

	let backdrop: HTMLElement | undefined;
	let panel: HTMLElement | undefined;

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	$effect(() => {
		if (open && backdrop && panel) {
			gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2 });
			gsap.fromTo(panel, { opacity: 0, scale: 0.95, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' });
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === backdrop) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={backdrop}
		onclick={handleBackdropClick}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
	>
		<div
			bind:this={panel}
			class="w-full {sizeClasses[size]} rounded-xl border border-surface-700 bg-surface-900 shadow-2xl"
		>
			{#if title}
				<div class="flex items-center justify-between border-b border-surface-700 px-5 py-4">
					<h2 class="text-lg font-semibold text-surface-100">{title}</h2>
					<button
						onclick={onclose}
						class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
					>
						<XIcon size={18} />
					</button>
				</div>
			{/if}
			<div class="px-5 py-4 max-h-[70vh] overflow-y-auto">
				{@render children()}
			</div>
			{#if footer}
				<div class="border-t border-surface-700 px-5 py-3 flex justify-end gap-2">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
