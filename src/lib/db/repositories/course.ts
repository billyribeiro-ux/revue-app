import { db } from '$lib/db';
import type { Course, CourseType, CourseStatus, CourseProvider } from '$lib/types';

export const courseRepo = {
	async getAll(workspaceId?: number): Promise<Course[]> {
		if (workspaceId) {
			return db.courses.where('workspaceId').equals(workspaceId).reverse().sortBy('updatedAt');
		}
		return db.courses.orderBy('updatedAt').reverse().toArray();
	},

	async getById(id: number): Promise<Course | undefined> {
		return db.courses.get(id);
	},

	async getByStatus(status: CourseStatus, workspaceId?: number): Promise<Course[]> {
		let collection = db.courses.where('status').equals(status);
		const results = await collection.toArray();
		if (workspaceId) {
			return results.filter((c) => c.workspaceId === workspaceId);
		}
		return results;
	},

	async create(data: {
		workspaceId: number;
		title: string;
		type?: CourseType;
		status?: CourseStatus;
		provider?: CourseProvider;
		description?: string;
		startDate?: number | null;
		targetDate?: number | null;
		tags?: string[];
	}): Promise<number> {
		const now = Date.now();
		return db.courses.add({
			workspaceId: data.workspaceId,
			title: data.title,
			type: data.type || 'course',
			status: data.status || 'active',
			provider: data.provider || '',
			description: data.description || '',
			startDate: data.startDate ?? null,
			targetDate: data.targetDate ?? null,
			tags: data.tags || [],
			keyConcepts: [],
			openQuestions: [],
			summary: '',
			createdAt: now,
			updatedAt: now
		});
	},

	async update(id: number, data: Partial<Course>): Promise<void> {
		await db.courses.update(id, { ...data, updatedAt: Date.now() });
	},

	async remove(id: number): Promise<void> {
		await db.transaction('rw', [db.courses, db.notes, db.tasks, db.sources, db.modules, db.sessions], async () => {
			await db.notes.where('courseId').equals(id).delete();
			await db.tasks.where('courseId').equals(id).delete();
			await db.sources.where('courseId').equals(id).delete();
			await db.modules.where('courseId').equals(id).delete();
			const sessions = await db.sessions.where('courseId').equals(id).toArray();
			for (const session of sessions) {
				if (session.id) await db.sessions.delete(session.id);
			}
			await db.courses.delete(id);
		});
	},

	async getNoteCount(courseId: number): Promise<number> {
		return db.notes.where('courseId').equals(courseId).count();
	},

	async getModuleCount(courseId: number): Promise<number> {
		return db.modules.where('courseId').equals(courseId).count();
	},

	async getCompletedModuleCount(courseId: number): Promise<number> {
		const modules = await db.modules.where('courseId').equals(courseId).toArray();
		return modules.filter((m) => m.completed).length;
	}
};
