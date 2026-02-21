<script lang="ts">
	import { getToasts, removeToast } from '$lib/stores/app.svelte';
	import { CheckCircleIcon, WarningCircleIcon, InfoIcon, XCircleIcon, XIcon } from 'phosphor-svelte';
	import gsap from 'gsap';

	let toastElements: Map<string, HTMLElement> = new Map();

	const toasts = $derived(getToasts());

	const iconMap = {
		success: CheckCircleIcon,
		error: XCircleIcon,
		warning: WarningCircleIcon,
		info: InfoIcon
	};

	const colorMap = {
		success: 'border-accent-green/30 bg-accent-green/10',
		error: 'border-accent-red/30 bg-accent-red/10',
		warning: 'border-accent-yellow/30 bg-accent-yellow/10',
		info: 'border-brand-500/30 bg-brand-500/10'
	};

	const textColorMap = {
		success: 'text-accent-green',
		error: 'text-accent-red',
		warning: 'text-accent-yellow',
		info: 'text-brand-400'
	};
</script>

<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
	{#each toasts as toast (toast.id)}
		<div
			class="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm {colorMap[toast.type]}"
		>
			<svelte:component this={iconMap[toast.type]} size={20} class={textColorMap[toast.type]} weight="fill" />
			<span class="text-sm text-surface-200">{toast.message}</span>
			<button
				onclick={() => removeToast(toast.id)}
				class="ml-2 rounded p-0.5 text-surface-400 hover:text-surface-200 transition-colors"
			>
				<XIcon size={14} />
			</button>
		</div>
	{/each}
</div>
