import { db } from '$lib/db';
import type { Tag } from '$lib/types';

export const tagRepo = {
	async getAll(): Promise<Tag[]> {
		return db.tags.orderBy('name').toArray();
	},

	async getById(id: number): Promise<Tag | undefined> {
		return db.tags.get(id);
	},

	async getByName(name: string): Promise<Tag | undefined> {
		return db.tags.where('name').equals(name.toLowerCase()).first();
	},

	async getOrCreate(name: string): Promise<number> {
		const normalized = name.toLowerCase().trim();
		const existing = await db.tags.where('name').equals(normalized).first();
		if (existing?.id) return existing.id;
		return db.tags.add({
			name: normalized,
			color: '',
			createdAt: Date.now()
		});
	},

	async create(name: string, color?: string): Promise<number> {
		return db.tags.add({
			name: name.toLowerCase().trim(),
			color: color || '',
			createdAt: Date.now()
		});
	},

	async rename(oldName: string, newName: string): Promise<void> {
		const normalizedOld = oldName.toLowerCase();
		const normalizedNew = newName.toLowerCase().trim();
		if (normalizedOld === normalizedNew) return;

		const tag = await db.tags.where('name').equals(normalizedOld).first();
		if (!tag?.id) return;

		await db.transaction('rw', [db.tags, db.notes, db.courses], async () => {
			await db.tags.update(tag.id!, { name: normalizedNew });

			const notes = await db.notes.where('tags').equals(normalizedOld).toArray();
			for (const note of notes) {
				const newTags = note.tags.map((t) => (t === normalizedOld ? normalizedNew : t));
				if (note.id) await db.notes.update(note.id, { tags: newTags });
			}

			const courses = await db.courses.where('tags').equals(normalizedOld).toArray();
			for (const course of courses) {
				const newTags = course.tags.map((t) => (t === normalizedOld ? normalizedNew : t));
				if (course.id) await db.courses.update(course.id, { tags: newTags });
			}
		});
	},

	async merge(sourceNames: string[], targetName: string): Promise<void> {
		const normalizedTarget = targetName.toLowerCase().trim();

		await this.getOrCreate(normalizedTarget);

		await db.transaction('rw', [db.tags, db.notes], async () => {
			for (const sourceName of sourceNames) {
				const normalized = sourceName.toLowerCase().trim();
				if (normalized === normalizedTarget) continue;

				const notes = await db.notes.where('tags').equals(normalized).toArray();
				for (const note of notes) {
					let newTags = note.tags.filter((t) => t !== normalized);
					if (!newTags.includes(normalizedTarget)) {
						newTags.push(normalizedTarget);
					}
					if (note.id) await db.notes.update(note.id, { tags: newTags });
				}

				const sourceTag = await db.tags.where('name').equals(normalized).first();
				if (sourceTag?.id) await db.tags.delete(sourceTag.id);
			}
		});
	},

	async remove(id: number): Promise<void> {
		const tag = await db.tags.get(id);
		if (!tag) return;

		await db.transaction('rw', [db.tags, db.notes, db.noteTagJoins, db.courseTagJoins], async () => {
			const notes = await db.notes.where('tags').equals(tag.name).toArray();
			for (const note of notes) {
				const newTags = note.tags.filter((t) => t !== tag.name);
				if (note.id) await db.notes.update(note.id, { tags: newTags });
			}

			await db.noteTagJoins.where('tagId').equals(id).delete();
			await db.courseTagJoins.where('tagId').equals(id).delete();
			await db.tags.delete(id);
		});
	},

	async getNoteCounts(): Promise<Map<string, number>> {
		const notes = await db.notes.toArray();
		const counts = new Map<string, number>();
		for (const note of notes) {
			for (const tag of note.tags) {
				counts.set(tag, (counts.get(tag) || 0) + 1);
			}
		}
		return counts;
	},

	async getUnused(): Promise<Tag[]> {
		const counts = await this.getNoteCounts();
		const allTags = await this.getAll();
		return allTags.filter((t) => !counts.has(t.name) || counts.get(t.name) === 0);
	},

	async getSuggestions(partial: string): Promise<string[]> {
		const all = await this.getAll();
		const lower = partial.toLowerCase();
		return all.filter((t) => t.name.includes(lower)).map((t) => t.name).slice(0, 10);
	}
};
