<script lang="ts">
	import type { Snippet } from 'svelte';
	import gsap from 'gsap';

	interface DropdownItem {
		label: string;
		icon?: string;
		onclick: () => void;
		variant?: 'default' | 'danger';
		disabled?: boolean;
	}

	interface Props {
		items: DropdownItem[];
		align?: 'left' | 'right';
		trigger: Snippet;
	}

	let { items, align = 'left', trigger }: Props = $props();

	let open = $state(false);
	let menu = $state<HTMLElement | undefined>(undefined);
	let wrapper = $state<HTMLElement | undefined>(undefined);
	let focusedIndex = $state(-1);

	$effect(() => {
		if (!open || !menu) return;
		focusedIndex = -1;
		const tween = gsap.fromTo(menu, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.15 });
		return () => tween?.kill();
	});

	function handleClickOutside(e: MouseEvent) {
		if (open && wrapper && !wrapper.contains(e.target as Node)) {
			open = false;
		}
	}

	function handleMenuKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
			focusMenuItem(focusedIndex);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			focusedIndex = Math.max(focusedIndex - 1, 0);
			focusMenuItem(focusedIndex);
		}
	}

	function focusMenuItem(index: number) {
		const buttons = menu?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]');
		buttons?.[index]?.focus();
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div bind:this={wrapper} class="relative inline-block">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div onclick={(e) => { e.stopPropagation(); open = !open; }}>
		{@render trigger()}
	</div>

	{#if open}
		<div
			id="dropdown-menu"
			role="menu"
			tabindex="-1"
			bind:this={menu}
			class="absolute z-40 mt-1 min-w-[180px] rounded-lg border border-surface-700 bg-surface-900 py-1 shadow-xl {align === 'right' ? 'right-0' : 'left-0'}"
			onclick={(e) => e.stopPropagation()}
			onkeydown={handleMenuKeydown}
		>
			{#each items as item (item.label)}
				<button
					type="button"
					role="menuitem"
					onclick={() => { item.onclick(); open = false; }}
					disabled={item.disabled}
					aria-disabled={item.disabled || undefined}
					class="w-full px-3 py-2 text-left text-sm transition-colors
						{item.variant === 'danger'
							? 'text-accent-red hover:bg-accent-red/10 focus:bg-accent-red/10'
							: 'text-surface-300 hover:bg-surface-800 hover:text-surface-100 focus:bg-surface-800 focus:text-surface-100'}
						disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
