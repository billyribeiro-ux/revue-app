<script lang="ts">
	import { onMount } from 'svelte';
	import {
		forceSimulation,
		forceLink,
		forceManyBody,
		forceCenter,
		forceCollide,
		type SimulationNodeDatum,
		type SimulationLinkDatum
	} from 'd3';
	import gsap from 'gsap';

	interface GraphNode extends SimulationNodeDatum {
		id: number;
		label: string;
		type: string;
	}

	interface GraphLink extends SimulationLinkDatum<GraphNode> {
		source: number | GraphNode;
		target: number | GraphNode;
	}

	interface Props {
		nodes: GraphNode[];
		links: GraphLink[];
		width?: number;
		height?: number;
	}

	let { nodes, links, width = 600, height = 400 }: Props = $props();

	let simNodes = $state<GraphNode[]>([]);
	let simLinks = $state<GraphLink[]>([]);
	let svg: SVGSVGElement | undefined;

	onMount(() => {
		if (nodes.length === 0) return;

		simNodes = nodes.map((n) => ({ ...n }));
		simLinks = links.map((l) => ({ ...l }));

		const simulation = forceSimulation<GraphNode>(simNodes)
			.force(
				'link',
				forceLink<GraphNode, GraphLink>(simLinks)
					.id((d) => d.id)
					.distance(80)
			)
			.force('charge', forceManyBody().strength(-200))
			.force('center', forceCenter(width / 2, height / 2))
			.force('collide', forceCollide(30))
			.on('tick', () => {
				simNodes = [...simNodes];
				simLinks = [...simLinks];
			});

		// Animate in
		if (svg) {
			gsap.fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.5 });
		}

		return () => simulation.stop();
	});

	function getNodeColor(type: string): string {
		const colors: Record<string, string> = {
			lecture: '#3b82f6',
			concept: '#eab308',
			practice: '#22c55e',
			review: '#a855f7',
			cheatsheet: '#06b6d4',
			buildlog: '#f97316',
			trading: '#ef4444',
			postmortem: '#ec4899',
			general: '#71717a'
		};
		return colors[type] || colors.general;
	}
</script>

<svg bind:this={svg} {width} {height} class="block rounded-lg border border-surface-800 bg-surface-900">
	<defs>
		<marker id="arrowhead" markerWidth="6" markerHeight="4" refX="20" refY="2" orient="auto">
			<polygon points="0 0, 6 2, 0 4" fill="var(--color-surface-600)" />
		</marker>
	</defs>

	<!-- Links -->
	{#each simLinks as link}
		{@const source = link.source as GraphNode}
		{@const target = link.target as GraphNode}
		{#if source.x != null && source.y != null && target.x != null && target.y != null}
			<line
				x1={source.x}
				y1={source.y}
				x2={target.x}
				y2={target.y}
				stroke="var(--color-surface-700)"
				stroke-width={1.5}
				marker-end="url(#arrowhead)"
			/>
		{/if}
	{/each}

	<!-- Nodes -->
	{#each simNodes as node}
		{#if node.x != null && node.y != null}
			<g transform="translate({node.x}, {node.y})" class="cursor-pointer">
				<circle
					r={10}
					fill={getNodeColor(node.type)}
					opacity={0.8}
					class="hover:opacity-100 transition-opacity"
				/>
				<text
					dy={-14}
					text-anchor="middle"
					fill="var(--color-surface-300)"
					font-size="10"
					class="pointer-events-none"
				>
					{node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
				</text>
			</g>
		{/if}
	{/each}

	{#if nodes.length === 0}
		<text x={width / 2} y={height / 2} text-anchor="middle" fill="var(--color-surface-500)" font-size="14">
			No linked notes to display
		</text>
	{/if}
</svg>
