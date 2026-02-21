<script lang="ts">
	interface Props {
		id?: string;
		value?: string;
		placeholder?: string;
		type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
		disabled?: boolean;
		class?: string;
		oninput?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
		onfocus?: (e: FocusEvent) => void;
		onblur?: (e: FocusEvent) => void;
	}

	let {
		id,
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		disabled = false,
		class: className = '',
		oninput,
		onkeydown,
		onfocus,
		onblur
	}: Props = $props();
</script>

<input
	{id}
	{type}
	{placeholder}
	{disabled}
	bind:value
	{oninput}
	{onkeydown}
	{onfocus}
	{onblur}
	class="w-full rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50 transition-colors {className}"
/>
