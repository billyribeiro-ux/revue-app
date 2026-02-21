<script lang="ts">
	import { scaleLinear, scaleTime, timeDay, timeWeek, max } from 'd3';
	import { subDays } from 'date-fns';
	import gsap from 'gsap';

	interface Props {
		data: { date: Date; count: number }[];
		weeks?: number;
	}

	let { data, weeks = 12 }: Props = $props();

	let container: SVGSVGElement | undefined;

	const cellSize = 14;
	const cellGap = 3;
	const totalSize = cellSize + cellGap;
	const daysInWeek = 7;

	const width = $derived(weeks * totalSize + 40);
	const height = $derived(daysInWeek * totalSize + 20);

	// Build a map from date string to count
	let countMap = $derived(() => {
		const map = new Map<string, number>();
		for (const d of data) {
			const key = d.date.toISOString().split('T')[0];
			map.set(key, (map.get(key) || 0) + d.count);
		}
		return map;
	});

	// Generate grid cells
	let cells = $derived(() => {
		const result: { x: number; y: number; date: Date; count: number; dateStr: string }[] = [];
		const today = new Date();
		const startDate = subDays(today, weeks * 7);

		for (let i = 0; i < weeks * 7; i++) {
			const date = subDays(today, weeks * 7 - 1 - i);
			const weekIdx = Math.floor(i / 7);
			const dayIdx = date.getDay();
			const dateStr = date.toISOString().split('T')[0];
			const cMap = countMap();
			result.push({
				x: weekIdx * totalSize,
				y: dayIdx * totalSize,
				date,
				count: cMap.get(dateStr) || 0,
				dateStr
			});
		}
		return result;
	});

	let maxCount = $derived(Math.max(1, ...cells().map((c) => c.count)));

	function getColor(count: number): string {
		if (count === 0) return 'var(--color-surface-800)';
		const intensity = count / maxCount;
		if (intensity < 0.25) return 'rgba(59, 130, 246, 0.3)';
		if (intensity < 0.5) return 'rgba(59, 130, 246, 0.5)';
		if (intensity < 0.75) return 'rgba(59, 130, 246, 0.7)';
		return 'rgba(59, 130, 246, 0.9)';
	}

	$effect(() => {
		if (container) {
			gsap.fromTo(
				container.querySelectorAll('rect'),
				{ opacity: 0 },
				{ opacity: 1, stagger: 0.002, duration: 0.3, ease: 'power2.out' }
			);
		}
	});

	const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
</script>

<div class="overflow-x-auto">
	<svg bind:this={container} width={width} {height} class="block">
		<!-- Day labels -->
		{#each dayLabels as label, i}
			{#if label}
				<text
					x={0}
					y={i * totalSize + cellSize - 1}
					fill="var(--color-surface-500)"
					font-size="9"
					text-anchor="start"
				>
					{label}
				</text>
			{/if}
		{/each}

		<!-- Cells -->
		<g transform="translate(30, 0)">
			{#each cells() as cell}
				<rect
					x={cell.x}
					y={cell.y}
					width={cellSize}
					height={cellSize}
					rx={2}
					fill={getColor(cell.count)}
					class="transition-colors"
				>
					<title>{cell.dateStr}: {cell.count} actions</title>
				</rect>
			{/each}
		</g>
	</svg>
</div>
