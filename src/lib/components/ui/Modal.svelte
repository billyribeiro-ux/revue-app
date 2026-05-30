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

	let backdrop = $state<HTMLElement | undefined>(undefined);
	let panel = $state<HTMLElement | undefined>(undefined);
	let titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;
	let previousActiveElement: HTMLElement | null = null;

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	$effect(() => {
		if (!open || !backdrop || !panel) return;

		previousActiveElement = document.activeElement as HTMLElement;
		const t1 = gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2 });
		const t2 = gsap.fromTo(panel, { opacity: 0, scale: 0.95, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' });

		const firstFocusable = panel.querySelector<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		requestAnimationFrame(() => firstFocusable?.focus());

		return () => {
			t1?.kill();
			t2?.kill();
			previousActiveElement?.focus();
		};
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === backdrop) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
			return;
		}
		if (e.key === 'Tab' && panel) {
			const focusable = panel.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
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
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? titleId : undefined}
			class="w-full {sizeClasses[size]} rounded-xl border border-surface-700 bg-surface-900 shadow-2xl"
		>
			{#if title}
				<div class="flex items-center justify-between border-b border-surface-700 px-5 py-4">
					<h2 id={titleId} class="text-lg font-semibold text-surface-100">{title}</h2>
					<button
						type="button"
						aria-label="Close modal"
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
