<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		confirmVariant?: 'primary' | 'danger';
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Confirm',
		confirmVariant = 'danger',
		onconfirm,
		oncancel
	}: Props = $props();
</script>

<Modal {open} {title} size="sm" onclose={oncancel}>
	<p class="text-sm text-surface-300">{message}</p>
	{#snippet footer()}
		<Button variant="ghost" onclick={oncancel}>Cancel</Button>
		<Button variant={confirmVariant} onclick={() => { onconfirm(); open = false; }}>{confirmLabel}</Button>
	{/snippet}
</Modal>
