import { db } from '$lib/db';
import type { Task, TaskStatus, TaskPriority } from '$lib/types';

export const taskRepo = {
	async getAll(options?: {
		courseId?: number;
		noteId?: number;
		sessionId?: number;
		status?: TaskStatus;
	}): Promise<Task[]> {
		let results: Task[];

		if (options?.courseId) {
			results = await db.tasks.where('courseId').equals(options.courseId).toArray();
		} else if (options?.noteId) {
			results = await db.tasks.where('noteId').equals(options.noteId).toArray();
		} else if (options?.sessionId) {
			results = await db.tasks.where('sessionId').equals(options.sessionId).toArray();
		} else if (options?.status) {
			results = await db.tasks.where('status').equals(options.status).toArray();
		} else {
			results = await db.tasks.toArray();
		}

		if (options?.status && options.courseId) {
			results = results.filter((t) => t.status === options.status);
		}

		results.sort((a, b) => {
			const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		});

		return results;
	},

	async getById(id: number): Promise<Task | undefined> {
		return db.tasks.get(id);
	},

	async getOpen(): Promise<Task[]> {
		const tasks = await db.tasks.where('status').anyOf(['open', 'doing']).toArray();
		const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
		return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
	},

	async getByDateRange(start: number, end: number, status?: TaskStatus): Promise<Task[]> {
		let tasks = await db.tasks.where('createdAt').between(start, end).toArray();
		if (status) {
			tasks = tasks.filter((t) => t.status === status);
		}
		return tasks;
	},

	async create(data: {
		title: string;
		noteId?: number | null;
		courseId?: number | null;
		sessionId?: number | null;
		priority?: TaskPriority;
		dueDate?: number | null;
	}): Promise<number> {
		const now = Date.now();
		return db.tasks.add({
			noteId: data.noteId ?? null,
			courseId: data.courseId ?? null,
			sessionId: data.sessionId ?? null,
			title: data.title,
			status: 'open',
			priority: data.priority || 'medium',
			dueDate: data.dueDate ?? null,
			createdAt: now,
			completedAt: null
		});
	},

	async updateStatus(id: number, status: TaskStatus): Promise<void> {
		const updates: Partial<Task> = { status };
		if (status === 'done') {
			updates.completedAt = Date.now();
		} else {
			updates.completedAt = null;
		}
		await db.tasks.update(id, updates);
	},

	async update(id: number, data: Partial<Task>): Promise<void> {
		await db.tasks.update(id, data);
	},

	async remove(id: number): Promise<void> {
		await db.tasks.delete(id);
	},

	async countByStatus(courseId?: number): Promise<Record<TaskStatus, number>> {
		let tasks: Task[];
		if (courseId) {
			tasks = await db.tasks.where('courseId').equals(courseId).toArray();
		} else {
			tasks = await db.tasks.toArray();
		}
		return {
			open: tasks.filter((t) => t.status === 'open').length,
			doing: tasks.filter((t) => t.status === 'doing').length,
			blocked: tasks.filter((t) => t.status === 'blocked').length,
			done: tasks.filter((t) => t.status === 'done').length
		};
	}
};
