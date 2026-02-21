import { db } from '$lib/db';
import type { Session } from '$lib/types';
import { getDurationMinutes } from '$lib/utils/date';

export const sessionRepo = {
	async getAll(courseId?: number): Promise<Session[]> {
		if (courseId) {
			return db.sessions.where('courseId').equals(courseId).reverse().sortBy('startTime');
		}
		return db.sessions.orderBy('startTime').reverse().toArray();
	},

	async getById(id: number): Promise<Session | undefined> {
		return db.sessions.get(id);
	},

	async getActive(): Promise<Session | undefined> {
		const sessions = await db.sessions.where('endTime').equals(0).toArray();
		return sessions.find((s) => s.endTime === null || s.endTime === 0) || undefined;
	},

	async getByDateRange(start: number, end: number): Promise<Session[]> {
		return db.sessions.where('startTime').between(start, end).toArray();
	},

	async create(data: {
		courseId?: number | null;
		workspaceId?: number | null;
	}): Promise<number> {
		const now = Date.now();
		return db.sessions.add({
			courseId: data.courseId ?? null,
			workspaceId: data.workspaceId ?? null,
			startTime: now,
			endTime: null,
			duration: null,
			summary: '',
			whatLearned: [],
			openQuestions: [],
			nextActions: [],
			linkedNoteIds: [],
			createdAt: now
		});
	},

	async endSession(id: number, data: {
		summary?: string;
		whatLearned?: string[];
		openQuestions?: string[];
		nextActions?: string[];
	}): Promise<void> {
		const session = await db.sessions.get(id);
		if (!session) return;
		const now = Date.now();
		await db.sessions.update(id, {
			endTime: now,
			duration: getDurationMinutes(session.startTime, now),
			summary: data.summary || session.summary,
			whatLearned: data.whatLearned || session.whatLearned,
			openQuestions: data.openQuestions || session.openQuestions,
			nextActions: data.nextActions || session.nextActions
		});
	},

	async addLinkedNote(sessionId: number, noteId: number): Promise<void> {
		const session = await db.sessions.get(sessionId);
		if (!session) return;
		if (!session.linkedNoteIds.includes(noteId)) {
			await db.sessions.update(sessionId, {
				linkedNoteIds: [...session.linkedNoteIds, noteId]
			});
		}
	},

	async update(id: number, data: Partial<Session>): Promise<void> {
		await db.sessions.update(id, data);
	},

	async remove(id: number): Promise<void> {
		await db.sessions.delete(id);
	},

	async getTotalMinutes(courseId?: number, start?: number, end?: number): Promise<number> {
		let sessions: Session[];
		if (courseId) {
			sessions = await db.sessions.where('courseId').equals(courseId).toArray();
		} else {
			sessions = await db.sessions.toArray();
		}
		if (start && end) {
			sessions = sessions.filter((s) => s.startTime >= start && s.startTime <= end);
		}
		return sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
	}
};
