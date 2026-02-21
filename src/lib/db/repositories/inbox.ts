import { db } from '$lib/db';
import type { InboxItem } from '$lib/types';

export const inboxRepo = {
	async getAll(): Promise<InboxItem[]> {
		return db.inboxItems.orderBy('createdAt').reverse().toArray();
	},

	async getById(id: number): Promise<InboxItem | undefined> {
		return db.inboxItems.get(id);
	},

	async create(data: { content: string; tags?: string[]; courseId?: number | null }): Promise<number> {
		return db.inboxItems.add({
			content: data.content.trim(),
			tags: data.tags || [],
			courseId: data.courseId ?? null,
			createdAt: Date.now()
		});
	},

	async update(id: number, data: Partial<InboxItem>): Promise<void> {
		await db.inboxItems.update(id, data);
	},

	async remove(id: number): Promise<void> {
		await db.inboxItems.delete(id);
	}
};
