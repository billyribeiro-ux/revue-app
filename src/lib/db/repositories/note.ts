import { db } from '$lib/db';
import { removeNoteFromIndex, indexNote } from '$lib/db/search';
import type { Note, NoteType, NoteVersion, NoteLink } from '$lib/types';

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const noteRepo = {
	async getAll(options?: {
		courseId?: number;
		workspaceId?: number;
		noteType?: NoteType;
		pinned?: boolean;
		favorited?: boolean;
		limit?: number;
	}): Promise<Note[]> {
		let results: Note[];

		if (options?.courseId) {
			results = await db.notes.where('courseId').equals(options.courseId).toArray();
		} else if (options?.workspaceId) {
			results = await db.notes.where('workspaceId').equals(options.workspaceId).toArray();
		} else {
			results = await db.notes.toArray();
		}

		if (options?.noteType) {
			results = results.filter((n) => n.noteType === options.noteType);
		}
		if (options?.pinned !== undefined) {
			results = results.filter((n) => n.pinned === options.pinned);
		}
		if (options?.favorited !== undefined) {
			results = results.filter((n) => n.favorited === options.favorited);
		}

		results.sort((a, b) => b.lastEditedAt - a.lastEditedAt);

		if (options?.limit) {
			results = results.slice(0, options.limit);
		}

		return results;
	},

	async getById(id: number): Promise<Note | undefined> {
		return db.notes.get(id);
	},

	async getRecent(limit: number = 10, workspaceId?: number): Promise<Note[]> {
		let results: Note[];
		if (workspaceId) {
			results = await db.notes.where('workspaceId').equals(workspaceId).toArray();
		} else {
			results = await db.notes.toArray();
		}
		results.sort((a, b) => b.lastEditedAt - a.lastEditedAt);
		return results.slice(0, limit);
	},

	async getEditedToday(): Promise<Note[]> {
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);
		return db.notes.where('lastEditedAt').aboveOrEqual(startOfDay.getTime()).toArray();
	},

	async create(data: {
		courseId?: number | null;
		workspaceId?: number | null;
		title: string;
		noteType?: NoteType;
		body?: string;
		tags?: string[];
	}): Promise<number> {
		const now = Date.now();
		const body = data.body || '';
		const id = await db.notes.add({
			courseId: data.courseId ?? null,
			workspaceId: data.workspaceId ?? null,
			title: data.title,
			noteType: data.noteType || 'general',
			body,
			bodyPlaintext: stripHtml(body),
			tags: data.tags || [],
			pinned: false,
			favorited: false,
			confidenceRating: null,
			createdAt: now,
			updatedAt: now,
			lastEditedAt: now
		});
		indexNote({
			id,
			title: data.title,
			bodyPlaintext: stripHtml(body),
			noteType: data.noteType || 'general',
			tags: data.tags || [],
			courseId: data.courseId ?? null
		});
		return id;
	},

	async update(id: number, data: Partial<Note>): Promise<void> {
		const updates: Partial<Note> = { ...data, updatedAt: Date.now(), lastEditedAt: Date.now() };
		if (data.body !== undefined) {
			updates.bodyPlaintext = stripHtml(data.body);
		}
		await db.notes.update(id, updates);
	},

	async remove(id: number): Promise<void> {
		removeNoteFromIndex(id);
		await db.transaction('rw', [db.notes, db.noteVersions, db.noteLinks, db.noteTagJoins, db.tasks, db.sources], async () => {
			await db.noteVersions.where('noteId').equals(id).delete();
			await db.noteLinks.where('sourceNoteId').equals(id).delete();
			await db.noteLinks.where('targetNoteId').equals(id).delete();
			await db.noteTagJoins.where('noteId').equals(id).delete();
			await db.tasks.where('noteId').equals(id).delete();
			await db.sources.where('noteId').equals(id).delete();
			await db.notes.delete(id);
		});
	},

	async togglePin(id: number): Promise<void> {
		const note = await db.notes.get(id);
		if (note) {
			await db.notes.update(id, { pinned: !note.pinned, updatedAt: Date.now() });
		}
	},

	async toggleFavorite(id: number): Promise<void> {
		const note = await db.notes.get(id);
		if (note) {
			await db.notes.update(id, { favorited: !note.favorited, updatedAt: Date.now() });
		}
	},

	// Version history
	async saveVersion(noteId: number): Promise<void> {
		const note = await db.notes.get(noteId);
		if (!note) return;
		await db.noteVersions.add({
			noteId,
			title: note.title,
			body: note.body,
			createdAt: Date.now()
		});
	},

	async getVersions(noteId: number): Promise<NoteVersion[]> {
		return db.noteVersions.where('noteId').equals(noteId).reverse().sortBy('createdAt');
	},

	async restoreVersion(noteId: number, versionId: number): Promise<void> {
		const version = await db.noteVersions.get(versionId);
		if (!version) return;
		// Save current state as a version before restoring
		await this.saveVersion(noteId);
		await this.update(noteId, {
			title: version.title,
			body: version.body
		});
	},

	// Backlinks
	async updateLinks(sourceNoteId: number, targetNoteIds: number[]): Promise<void> {
		await db.transaction('rw', db.noteLinks, async () => {
			await db.noteLinks.where('sourceNoteId').equals(sourceNoteId).delete();
			for (const targetNoteId of targetNoteIds) {
				await db.noteLinks.add({ sourceNoteId, targetNoteId });
			}
		});
	},

	async getBacklinks(noteId: number): Promise<Note[]> {
		const links = await db.noteLinks.where('targetNoteId').equals(noteId).toArray();
		const sourceIds = links.map((l) => l.sourceNoteId);
		return db.notes.where('id').anyOf(sourceIds).toArray();
	},

	async getForwardLinks(noteId: number): Promise<Note[]> {
		const links = await db.noteLinks.where('sourceNoteId').equals(noteId).toArray();
		const targetIds = links.map((l) => l.targetNoteId);
		return db.notes.where('id').anyOf(targetIds).toArray();
	},

	async count(workspaceId?: number): Promise<number> {
		if (workspaceId) {
			return db.notes.where('workspaceId').equals(workspaceId).count();
		}
		return db.notes.count();
	}
};
