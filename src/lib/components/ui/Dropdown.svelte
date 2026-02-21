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

	$effect(() => {
		if (!open || !menu) return;
		const tween = gsap.fromTo(menu, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.15 });
		return () => tween?.kill();
	});

	function handleClickOutside(e: MouseEvent) {
		if (open) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative inline-block">
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
			onkeydown={(e) => { if (e.key === 'Escape') open = false; }}
		>
			{#each items as item}
				<button
					type="button"
					role="menuitem"
					onclick={() => { item.onclick(); open = false; }}
					disabled={item.disabled}
					class="w-full px-3 py-2 text-left text-sm transition-colors
						{item.variant === 'danger'
							? 'text-accent-red hover:bg-accent-red/10'
							: 'text-surface-300 hover:bg-surface-800 hover:text-surface-100'}
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
