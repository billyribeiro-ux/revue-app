import { db } from '$lib/db';
import type { Source, SourceType } from '$lib/types';

export const sourceRepo = {
	async getAll(options?: { noteId?: number; courseId?: number; type?: SourceType }): Promise<Source[]> {
		let results: Source[];

		if (options?.noteId) {
			results = await db.sources.where('noteId').equals(options.noteId).toArray();
		} else if (options?.courseId) {
			results = await db.sources.where('courseId').equals(options.courseId).toArray();
		} else {
			results = await db.sources.toArray();
		}

		if (options?.type) {
			results = results.filter((s) => s.type === options.type);
		}

		return results.sort((a, b) => b.createdAt - a.createdAt);
	},

	async getById(id: number): Promise<Source | undefined> {
		return db.sources.get(id);
	},

	async create(data: {
		noteId?: number | null;
		courseId?: number | null;
		type: SourceType;
		title?: string;
		url?: string;
		excerpt?: string;
		videoTimestamp?: string;
	}): Promise<number> {
		return db.sources.add({
			noteId: data.noteId ?? null,
			courseId: data.courseId ?? null,
			type: data.type,
			title: data.title || '',
			url: data.url || '',
			excerpt: data.excerpt || '',
			videoTimestamp: data.videoTimestamp || '',
			createdAt: Date.now()
		});
	},

	async update(id: number, data: Partial<Source>): Promise<void> {
		await db.sources.update(id, data);
	},

	async remove(id: number): Promise<void> {
		await db.sources.delete(id);
	}
};
