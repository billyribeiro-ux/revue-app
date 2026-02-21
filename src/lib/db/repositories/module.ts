import { db } from '$lib/db';
import type { Module } from '$lib/types';

export const moduleRepo = {
	async getByCourseId(courseId: number): Promise<Module[]> {
		return db.modules.where('courseId').equals(courseId).sortBy('order');
	},

	async getById(id: number): Promise<Module | undefined> {
		return db.modules.get(id);
	},

	async create(data: {
		courseId: number;
		title: string;
		description?: string;
		order?: number;
	}): Promise<number> {
		const now = Date.now();
		const order = data.order ?? (await db.modules.where('courseId').equals(data.courseId).count());
		return db.modules.add({
			courseId: data.courseId,
			title: data.title,
			description: data.description || '',
			order,
			completed: false,
			createdAt: now
		});
	},

	async update(id: number, data: Partial<Module>): Promise<void> {
		await db.modules.update(id, data);
	},

	async toggleComplete(id: number): Promise<void> {
		const m = await db.modules.get(id);
		if (m) {
			await db.modules.update(id, { completed: !m.completed });
		}
	},

	async remove(id: number): Promise<void> {
		await db.modules.delete(id);
	},

	async getCompleted(): Promise<Module[]> {
		return db.modules.filter((m) => m.completed === true).toArray();
	}
};
