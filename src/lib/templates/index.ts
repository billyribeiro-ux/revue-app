import type { NoteTemplate, NoteType } from '$lib/types';

export const noteTemplates: NoteTemplate[] = [
	{
		type: 'lecture',
		label: 'Lecture Notes',
		description: 'Capture key points from lectures and presentations',
		icon: 'GraduationCap',
		defaultBody: `<h2>Key Points</h2>
<ul><li></li></ul>
<h2>Examples</h2>
<ul><li></li></ul>
<h2>Questions</h2>
<ul><li></li></ul>
<h2>Sources</h2>
<ul><li></li></ul>
<h2>Next Actions</h2>
<ul><li></li></ul>`
	},
	{
		type: 'concept',
		label: 'Concept Card',
		description: 'Define and understand a key concept',
		icon: 'Lightbulb',
		defaultBody: `<h2>Definition</h2>
<p></p>
<h2>Intuition (Plain English)</h2>
<p></p>
<h2>Example</h2>
<p></p>
<h2>Common Mistakes</h2>
<ul><li></li></ul>
<h2>Related Concepts</h2>
<ul><li></li></ul>`
	},
	{
		type: 'practice',
		label: 'Practice / Exercise',
		description: 'Document practice sessions and exercises',
		icon: 'Barbell',
		defaultBody: `<h2>Goal</h2>
<p></p>
<h2>Steps</h2>
<ol><li></li></ol>
<h2>Outcome</h2>
<p></p>
<h2>Errors / Bugs</h2>
<ul><li></li></ul>
<h2>Fix</h2>
<p></p>
<h2>What I Learned</h2>
<ul><li></li></ul>
<h2>Next Iteration</h2>
<ul><li></li></ul>`
	},
	{
		type: 'review',
		label: 'Review / Reflection',
		description: 'Reflect on what you learned and plan next steps',
		icon: 'ArrowsClockwise',
		defaultBody: `<h2>What I Reviewed</h2>
<ul><li></li></ul>
<h2>What Clicked</h2>
<ul><li></li></ul>
<h2>What's Unclear</h2>
<ul><li></li></ul>
<h2>How I'll Practice</h2>
<ul><li></li></ul>
<h2>Next Actions</h2>
<ul><li></li></ul>`
	},
	{
		type: 'cheatsheet',
		label: 'Cheat Sheet',
		description: 'Quick reference with rules and examples',
		icon: 'FileText',
		defaultBody: `<h2>Rules</h2>
<ol><li></li></ol>
<h2>Quick Examples</h2>
<pre><code></code></pre>
<h2>Links to Deeper Notes</h2>
<ul><li></li></ul>`
	},
	{
		type: 'buildlog',
		label: 'Project Build Log',
		description: 'Document what you built and decisions made',
		icon: 'Hammer',
		defaultBody: `<h2>What I Built</h2>
<p></p>
<h2>Decisions Made</h2>
<ul><li></li></ul>
<h2>Problems Encountered</h2>
<ul><li></li></ul>
<h2>Solutions</h2>
<ul><li></li></ul>
<h2>Next Steps</h2>
<ul><li></li></ul>`
	},
	{
		type: 'trading',
		label: 'Trading Analysis / Thesis',
		description: 'Document trading thesis and analysis',
		icon: 'ChartLine',
		defaultBody: `<h2>Market Context</h2>
<p></p>
<h2>Thesis</h2>
<p></p>
<h2>Key Levels</h2>
<ul><li></li></ul>
<h2>Confirmations / Invalidation</h2>
<ul><li></li></ul>
<h2>Risk Plan</h2>
<p></p>
<h2>Post-Trade Review</h2>
<p></p>`
	},
	{
		type: 'postmortem',
		label: 'Post-Mortem / After Action Review',
		description: 'Analyze what happened and what to change',
		icon: 'MagnifyingGlass',
		defaultBody: `<h2>What Happened</h2>
<p></p>
<h2>Expected vs Actual</h2>
<p></p>
<h2>Root Cause</h2>
<p></p>
<h2>What I'll Change</h2>
<ul><li></li></ul>
<h2>Checklist Update</h2>
<ul><li></li></ul>
<h2>Follow-up Task</h2>
<ul><li></li></ul>`
	},
	{
		type: 'general',
		label: 'General Note',
		description: 'Free-form note for any purpose',
		icon: 'Note',
		defaultBody: ''
	}
];

export function getTemplate(type: NoteType): NoteTemplate {
	return noteTemplates.find((t) => t.type === type) || noteTemplates[noteTemplates.length - 1];
}

export function getTemplateBody(type: NoteType): string {
	return getTemplate(type).defaultBody;
}
