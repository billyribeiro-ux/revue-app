import FlexSearch from 'flexsearch';
import { db } from '$lib/db';
import type { SearchResult } from '$lib/types';

interface NoteDoc {
	id: number;
	title: string;
	body: string;
	noteType: string;
	tags: string;
	courseId: number | null;
}

interface CourseDoc {
	id: number;
	title: string;
	description: string;
	tags: string;
}

const noteIndex = new FlexSearch.Index({
	tokenize: 'forward',
	resolution: 9
});

const courseIndex = new FlexSearch.Index({
	tokenize: 'forward',
	resolution: 9
});

const noteStore = new Map<number, NoteDoc>();
const courseStore = new Map<number, CourseDoc>();

let initialized = false;

export async function initSearchIndex(): Promise<void> {
	if (initialized) return;

	const notes = await db.notes.toArray();
	for (const note of notes) {
		if (!note.id) continue;
		const doc: NoteDoc = {
			id: note.id,
			title: note.title,
			body: note.bodyPlaintext,
			noteType: note.noteType,
			tags: note.tags.join(' '),
			courseId: note.courseId
		};
		noteStore.set(note.id, doc);
		noteIndex.add(note.id, `${doc.title} ${doc.body} ${doc.tags}`);
	}

	const courses = await db.courses.toArray();
	for (const course of courses) {
		if (!course.id) continue;
		const doc: CourseDoc = {
			id: course.id,
			title: course.title,
			description: course.description,
			tags: course.tags.join(' ')
		};
		courseStore.set(course.id, doc);
		courseIndex.add(course.id, `${doc.title} ${doc.description} ${doc.tags}`);
	}

	initialized = true;
}

export function indexNote(note: { id: number; title: string; bodyPlaintext: string; noteType: string; tags: string[]; courseId: number | null }): void {
	const doc: NoteDoc = {
		id: note.id,
		title: note.title,
		body: note.bodyPlaintext,
		noteType: note.noteType,
		tags: note.tags.join(' '),
		courseId: note.courseId
	};
	noteStore.set(note.id, doc);
	noteIndex.remove(note.id);
	noteIndex.add(note.id, `${doc.title} ${doc.body} ${doc.tags}`);
}

export function removeNoteFromIndex(id: number): void {
	noteStore.delete(id);
	noteIndex.remove(id);
}

export function indexCourse(course: { id: number; title: string; description: string; tags: string[] }): void {
	const doc: CourseDoc = {
		id: course.id,
		title: course.title,
		description: course.description,
		tags: course.tags.join(' ')
	};
	courseStore.set(course.id, doc);
	courseIndex.remove(course.id);
	courseIndex.add(course.id, `${doc.title} ${doc.description} ${doc.tags}`);
}

export function removeCourseFromIndex(id: number): void {
	courseStore.delete(id);
	courseIndex.remove(id);
}

export async function search(query: string, limit: number = 20): Promise<SearchResult[]> {
	if (!query.trim()) return [];

	const results: SearchResult[] = [];

	const noteIds = noteIndex.search(query, { limit }) as number[];
	const matchedNoteDocs = noteIds.map((id) => ({ id, doc: noteStore.get(id) })).filter((n) => n.doc);
	if (matchedNoteDocs.length > 0) {
		const noteRecords = await db.notes.where('id').anyOf(matchedNoteDocs.map((n) => n.id)).toArray();
		const noteMap = new Map(noteRecords.map((n) => [n.id, n]));
		for (const { id, doc } of matchedNoteDocs) {
			if (!doc) continue;
			const note = noteMap.get(id);
			results.push({
				type: 'note',
				id,
				title: doc.title,
				subtitle: doc.body.substring(0, 100),
				noteType: note?.noteType,
				tags: note?.tags,
				updatedAt: note?.updatedAt
			});
		}
	}

	const courseIds = courseIndex.search(query, { limit: 5 }) as number[];
	const matchedCourseDocs = courseIds.map((id) => ({ id, doc: courseStore.get(id) })).filter((c) => c.doc);
	if (matchedCourseDocs.length > 0) {
		const courseRecords = await db.courses.where('id').anyOf(matchedCourseDocs.map((c) => c.id)).toArray();
		const courseMap = new Map(courseRecords.map((c) => [c.id, c]));
		for (const { id, doc } of matchedCourseDocs) {
			if (!doc) continue;
			const course = courseMap.get(id);
			results.push({
				type: 'course',
				id,
				title: doc.title,
				subtitle: doc.description.substring(0, 100),
				tags: course?.tags,
				updatedAt: course?.updatedAt
			});
		}
	}

	const lowerQuery = query.toLowerCase();
	const tags = await db.tags.toArray();
	for (const tag of tags) {
		if (tag.name.includes(lowerQuery) && tag.id) {
			results.push({
				type: 'tag',
				id: tag.id,
				title: tag.name,
				subtitle: 'Tag'
			});
		}
	}

	return results;
}
