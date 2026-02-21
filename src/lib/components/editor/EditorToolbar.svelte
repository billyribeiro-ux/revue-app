<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import {
		TextBIcon,
		TextItalicIcon,
		TextUnderlineIcon,
		TextStrikethroughIcon,
		CodeIcon,
		ListBulletsIcon,
		ListNumbersIcon,
		CheckSquareIcon,
		QuotesIcon,
		MinusIcon,
		TableIcon,
		ImageIcon,
		LinkIcon,
		HighlighterCircleIcon,
		TextHOneIcon,
		TextHTwoIcon,
		TextHThreeIcon,
		ArrowUUpLeftIcon,
		ArrowUUpRightIcon
	} from 'phosphor-svelte';

	interface Props {
		editor: Editor;
	}

	let { editor }: Props = $props();

	// Force toolbar reactivity on editor transaction
	let updateKey = $state(0);
	$effect(() => {
		const handler = () => { updateKey++; };
		editor.on('transaction', handler);
		return () => { editor.off('transaction', handler); };
	});

	function addLink() {
		const url = prompt('Enter URL:');
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	}

	function addImage() {
		const url = prompt('Enter image URL:');
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	}

	function insertTable() {
		editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	}

	import type { Component } from 'svelte';

	interface ToolbarButton {
		icon: Component<Record<string, unknown>>;
		label: string;
		action: () => void;
		isActive?: () => boolean;
	}

	const formatButtons: ToolbarButton[] = [
		{
			icon: TextBIcon,
			label: 'Bold',
			action: () => editor.chain().focus().toggleBold().run(),
			isActive: () => editor.isActive('bold')
		},
		{
			icon: TextItalicIcon,
			label: 'Italic',
			action: () => editor.chain().focus().toggleItalic().run(),
			isActive: () => editor.isActive('italic')
		},
		{
			icon: TextUnderlineIcon,
			label: 'Underline',
			action: () => editor.chain().focus().toggleUnderline().run(),
			isActive: () => editor.isActive('underline')
		},
		{
			icon: TextStrikethroughIcon,
			label: 'Strikethrough',
			action: () => editor.chain().focus().toggleStrike().run(),
			isActive: () => editor.isActive('strike')
		},
		{
			icon: HighlighterCircleIcon,
			label: 'Highlight',
			action: () => editor.chain().focus().toggleHighlight().run(),
			isActive: () => editor.isActive('highlight')
		},
		{
			icon: CodeIcon,
			label: 'Code',
			action: () => editor.chain().focus().toggleCode().run(),
			isActive: () => editor.isActive('code')
		}
	];

	const headingButtons: ToolbarButton[] = [
		{
			icon: TextHOneIcon,
			label: 'Heading 1',
			action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
			isActive: () => editor.isActive('heading', { level: 1 })
		},
		{
			icon: TextHTwoIcon,
			label: 'Heading 2',
			action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
			isActive: () => editor.isActive('heading', { level: 2 })
		},
		{
			icon: TextHThreeIcon,
			label: 'Heading 3',
			action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
			isActive: () => editor.isActive('heading', { level: 3 })
		}
	];

	const blockButtons: ToolbarButton[] = [
		{
			icon: ListBulletsIcon,
			label: 'Bullet List',
			action: () => editor.chain().focus().toggleBulletList().run(),
			isActive: () => editor.isActive('bulletList')
		},
		{
			icon: ListNumbersIcon,
			label: 'Ordered List',
			action: () => editor.chain().focus().toggleOrderedList().run(),
			isActive: () => editor.isActive('orderedList')
		},
		{
			icon: CheckSquareIcon,
			label: 'Task List',
			action: () => editor.chain().focus().toggleTaskList().run(),
			isActive: () => editor.isActive('taskList')
		},
		{
			icon: QuotesIcon,
			label: 'Blockquote',
			action: () => editor.chain().focus().toggleBlockquote().run(),
			isActive: () => editor.isActive('blockquote')
		},
		{
			icon: CodeIcon,
			label: 'Code Block',
			action: () => editor.chain().focus().toggleCodeBlock().run(),
			isActive: () => editor.isActive('codeBlock')
		},
		{
			icon: MinusIcon,
			label: 'Horizontal Rule',
			action: () => editor.chain().focus().setHorizontalRule().run()
		}
	];
</script>

{#key updateKey}
<div class="flex flex-wrap items-center gap-0.5 border-b border-surface-700 pb-2 mb-2">
	<!-- Headings -->
	{#each headingButtons as btn}
		{@const BtnIcon = btn.icon}
		<button
			onclick={btn.action}
			class="rounded p-1.5 transition-colors
				{btn.isActive?.() ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'}"
			title={btn.label}
		>
			<BtnIcon size={16} />
		</button>
	{/each}

	<div class="w-px h-5 bg-surface-700 mx-1"></div>

	<!-- Formatting -->
	{#each formatButtons as btn}
		{@const BtnIcon = btn.icon}
		<button
			onclick={btn.action}
			class="rounded p-1.5 transition-colors
				{btn.isActive?.() ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'}"
			title={btn.label}
		>
			<BtnIcon size={16} />
		</button>
	{/each}

	<div class="w-px h-5 bg-surface-700 mx-1"></div>

	<!-- Block elements -->
	{#each blockButtons as btn}
		{@const BtnIcon = btn.icon}
		<button
			onclick={btn.action}
			class="rounded p-1.5 transition-colors
				{btn.isActive?.() ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'}"
			title={btn.label}
		>
			<BtnIcon size={16} />
		</button>
	{/each}

	<div class="w-px h-5 bg-surface-700 mx-1"></div>

	<!-- Insert -->
	<button
		onclick={addLink}
		class="rounded p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
		title="Add Link"
	>
		<LinkIcon size={16} />
	</button>
	<button
		onclick={addImage}
		class="rounded p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
		title="Add Image"
	>
		<ImageIcon size={16} />
	</button>
	<button
		onclick={insertTable}
		class="rounded p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
		title="Insert Table"
	>
		<TableIcon size={16} />
	</button>

	<div class="flex-1"></div>

	<!-- Undo/Redo -->
	<button
		onclick={() => editor.chain().focus().undo().run()}
		disabled={!editor.can().undo()}
		class="rounded p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors disabled:opacity-30"
		title="Undo"
	>
		<ArrowUUpLeftIcon size={16} />
	</button>
	<button
		onclick={() => editor.chain().focus().redo().run()}
		disabled={!editor.can().redo()}
		class="rounded p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors disabled:opacity-30"
		title="Redo"
	>
		<ArrowUUpRightIcon size={16} />
	</button>
</div>
{/key}
