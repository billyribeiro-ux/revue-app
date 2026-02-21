<script lang="ts">
	import gsap from 'gsap';

	interface Props {
		value: number;
		max: number;
		label: string;
		color?: string;
		size?: number;
	}

	let { value, max, label, color = 'var(--color-brand-500)', size = 120 }: Props = $props();

	let circle: SVGCircleElement | undefined;

	const strokeWidth = 8;
	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const pct = $derived(max > 0 ? Math.min(1, value / max) : 0);
	const offset = $derived(circumference * (1 - pct));

	$effect(() => {
		if (!circle) return;
		const tween = gsap.fromTo(
			circle,
			{ strokeDashoffset: circumference },
			{ strokeDashoffset: offset, duration: 1.2, ease: 'power2.out' }
		);
		return () => tween?.kill();
	});
</script>

<div class="flex flex-col items-center">
	<svg width={size} height={size} class="transform -rotate-90">
		<!-- Background circle -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="var(--color-surface-800)"
			stroke-width={strokeWidth}
		/>
		<!-- Progress circle -->
		<circle
			bind:this={circle}
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={color}
			stroke-width={strokeWidth}
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			stroke-linecap="round"
		/>
	</svg>
	<div class="mt-2 text-center -mt-[calc(theme(spacing.2)+{size}px/2+10px)]" style="margin-top: -{size / 2 + 8}px;">
		<span class="text-lg font-bold text-surface-100">{Math.round(pct * 100)}%</span>
	</div>
	<p class="text-xs text-surface-500 mt-6">{label}</p>
	<p class="text-xs text-surface-600">{value} / {max}</p>
</div>
