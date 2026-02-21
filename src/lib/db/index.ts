import Dexie, { type Table, type DBCoreMutateRequest } from 'dexie';
import type {
	Workspace,
	Course,
	Note,
	NoteVersion,
	NoteLink,
	Session,
	Task,
	Source,
	Tag,
	NoteTagJoin,
	CourseTagJoin,
	SavedSearch,
	InboxItem,
	Module
} from '$lib/types';

export class NotesOSDatabase extends Dexie {
	workspaces!: Table<Workspace, number>;
	courses!: Table<Course, number>;
	notes!: Table<Note, number>;
	noteVersions!: Table<NoteVersion, number>;
	noteLinks!: Table<NoteLink, number>;
	sessions!: Table<Session, number>;
	tasks!: Table<Task, number>;
	sources!: Table<Source, number>;
	tags!: Table<Tag, number>;
	noteTagJoins!: Table<NoteTagJoin, number>;
	courseTagJoins!: Table<CourseTagJoin, number>;
	savedSearches!: Table<SavedSearch, number>;
	inboxItems!: Table<InboxItem, number>;
	modules!: Table<Module, number>;

	constructor() {
		super('NotesOS');

		this.version(1).stores({
			workspaces: '++id, name, createdAt, updatedAt',
			courses: '++id, workspaceId, title, type, status, createdAt, updatedAt, *tags',
			notes: '++id, courseId, workspaceId, title, noteType, pinned, favorited, createdAt, updatedAt, lastEditedAt, *tags',
			noteVersions: '++id, noteId, createdAt',
			noteLinks: '++id, sourceNoteId, targetNoteId, [sourceNoteId+targetNoteId]',
			sessions: '++id, courseId, workspaceId, startTime, endTime, createdAt',
			tasks: '++id, noteId, courseId, sessionId, status, priority, dueDate, createdAt, completedAt',
			sources: '++id, noteId, courseId, type, createdAt',
			tags: '++id, &name, createdAt',
			noteTagJoins: '++id, [noteId+tagId], noteId, tagId',
			courseTagJoins: '++id, [courseId+tagId], courseId, tagId',
			savedSearches: '++id, name, createdAt',
			inboxItems: '++id, createdAt',
			modules: '++id, courseId, order, completed'
		});
	}
}

export const db = new NotesOSDatabase();

function stripProxy<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

db.use({
	stack: 'dbcore',
	name: 'svelte-proxy-stripper',
	create(downlevelDatabase) {
		return {
			...downlevelDatabase,
			table(tableName) {
				const downlevelTable = downlevelDatabase.table(tableName);
				return {
					...downlevelTable,
					mutate(req: DBCoreMutateRequest) {
						if (req.type === 'add' || req.type === 'put') {
							return downlevelTable.mutate({
								...req,
								values: req.values.map(stripProxy)
							});
						}
						return downlevelTable.mutate(req);
					}
				};
			}
		};
	}
});

// Seed default workspace if none exists
export async function initializeDatabase(): Promise<void> {
	const count = await db.workspaces.count();
	if (count === 0) {
		await db.workspaces.add({
			name: 'Personal Learning',
			description: 'Default workspace for personal learning notes',
			color: 'blue',
			icon: 'BookOpen',
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
	}
}
