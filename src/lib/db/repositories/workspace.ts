import { db } from '$lib/db';
import type { Workspace, WorkspaceColor } from '$lib/types';

export const workspaceRepo = {
	async getAll(): Promise<Workspace[]> {
		return db.workspaces.orderBy('createdAt').toArray();
	},

	async getById(id: number): Promise<Workspace | undefined> {
		return db.workspaces.get(id);
	},

	async create(data: { name: string; description?: string; color?: WorkspaceColor; icon?: string }): Promise<number> {
		const now = Date.now();
		return db.workspaces.add({
			name: data.name,
			description: data.description || '',
			color: data.color || 'blue',
			icon: data.icon || 'BookOpen',
			createdAt: now,
			updatedAt: now
		});
	},

	async update(id: number, data: Partial<Workspace>): Promise<void> {
		await db.workspaces.update(id, { ...data, updatedAt: Date.now() });
	},

	async remove(id: number): Promise<void> {
		await db.transaction('rw', [db.workspaces, db.courses, db.notes, db.sessions], async () => {
			await db.workspaces.delete(id);
			const courses = await db.courses.where('workspaceId').equals(id).toArray();
			for (const course of courses) {
				if (course.id) {
					await db.notes.where('courseId').equals(course.id).delete();
				}
			}
			await db.courses.where('workspaceId').equals(id).delete();
			await db.notes.where('workspaceId').equals(id).delete();
			await db.sessions.where('workspaceId').equals(id).delete();
		});
	}
};
