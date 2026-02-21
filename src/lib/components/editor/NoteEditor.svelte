<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
	import Highlight from '@tiptap/extension-highlight';
	import Typography from '@tiptap/extension-typography';
	import Underline from '@tiptap/extension-underline';
	import EditorToolbar from './EditorToolbar.svelte';

	interface Props {
		content: string;
		onupdate: (html: string) => void;
		placeholder?: string;
		editable?: boolean;
	}

	let { content, onupdate, placeholder = 'Start writing...', editable = true }: Props = $props();

	let editorElement: HTMLElement | undefined;
	let editor: Editor | undefined = $state();

	onMount(() => {
		editor = new Editor({
			element: editorElement!,
			extensions: [
				StarterKit.configure({
					heading: { levels: [1, 2, 3] },
					codeBlock: {
						HTMLAttributes: { class: 'code-block' }
					}
				}),
				Placeholder.configure({ placeholder }),
				Link.configure({
					openOnClick: true,
					HTMLAttributes: { class: 'editor-link' }
				}),
				Image.configure({
					HTMLAttributes: { class: 'editor-image' }
				}),
				TaskList,
				TaskItem.configure({ nested: true }),
				Table.configure({ resizable: true }),
				TableRow,
				TableCell,
				TableHeader,
				Highlight.configure({ multicolor: true }),
				Typography,
				Underline
			],
			content,
			editable,
			onUpdate: ({ editor }) => {
				onupdate(editor.getHTML());
			},
			editorProps: {
				attributes: {
					class: 'tiptap prose prose-invert max-w-none focus:outline-none'
				}
			}
		});

		return () => {
			editor?.destroy();
		};
	});

	export function getEditor(): Editor | undefined {
		return editor;
	}
</script>

<div class="flex flex-col h-full">
	{#if editor}
		<EditorToolbar {editor} />
	{/if}
	<div
		bind:this={editorElement}
		class="flex-1 overflow-y-auto px-1 py-3"
	></div>
</div>
