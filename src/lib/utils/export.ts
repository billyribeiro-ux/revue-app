import TurndownService from 'turndown';
import { db } from '$lib/db';
import type { Note, Course } from '$lib/types';
import { saveFile } from './platform';

const turndown = new TurndownService({
	headingStyle: 'atx',
	codeBlockStyle: 'fenced'
});

export function htmlToMarkdown(html: string): string {
	return turndown.turndown(html);
}

export function noteToMarkdown(note: Note): string {
	const lines: string[] = [];
	lines.push(`# ${note.title}`);
	lines.push('');
	if (note.tags.length > 0) {
		lines.push(`**Tags:** ${note.tags.map((t) => `#${t}`).join(' ')}`);
		lines.push('');
	}
	lines.push(`**Type:** ${note.noteType}`);
	lines.push(`**Created:** ${new Date(note.createdAt).toISOString()}`);
	lines.push(`**Last Edited:** ${new Date(note.lastEditedAt).toISOString()}`);
	lines.push('');
	lines.push('---');
	lines.push('');
	lines.push(htmlToMarkdown(note.body));
	return lines.join('\n');
}

export function noteToJson(note: Note): string {
	return JSON.stringify(note, null, 2);
}

export async function courseToMarkdown(courseId: number): Promise<string> {
	const course = await db.courses.get(courseId);
	if (!course) return '';

	const notes = await db.notes.where('courseId').equals(courseId).toArray();
	const lines: string[] = [];

	lines.push(`# ${course.title}`);
	lines.push('');
	lines.push(`**Type:** ${course.type}`);
	lines.push(`**Status:** ${course.status}`);
	if (course.provider) lines.push(`**Provider:** ${course.provider}`);
	if (course.description) {
		lines.push('');
		lines.push(course.description);
	}
	lines.push('');
	lines.push('---');
	lines.push('');

	for (const note of notes) {
		lines.push(`## ${note.title}`);
		lines.push('');
		lines.push(`*Type: ${note.noteType} | Created: ${new Date(note.createdAt).toISOString()}*`);
		lines.push('');
		lines.push(htmlToMarkdown(note.body));
		lines.push('');
		lines.push('---');
		lines.push('');
	}

	return lines.join('\n');
}

export async function exportAllToJson(): Promise<string> {
	const data = {
		version: 1,
		exportedAt: new Date().toISOString(),
		workspaces: await db.workspaces.toArray(),
		courses: await db.courses.toArray(),
		notes: await db.notes.toArray(),
		noteVersions: await db.noteVersions.toArray(),
		noteLinks: await db.noteLinks.toArray(),
		sessions: await db.sessions.toArray(),
		tasks: await db.tasks.toArray(),
		sources: await db.sources.toArray(),
		tags: await db.tags.toArray(),
		savedSearches: await db.savedSearches.toArray(),
		inboxItems: await db.inboxItems.toArray(),
		modules: await db.modules.toArray()
	};
	return JSON.stringify(data, null, 2);
}

export async function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): Promise<void> {
	const ext = filename.split('.').pop() || 'txt';
	const filterName = ext === 'json' ? 'JSON Files' : ext === 'md' ? 'Markdown Files' : 'Text Files';
	await saveFile(content, filename, [{ name: filterName, extensions: [ext] }]);
}
