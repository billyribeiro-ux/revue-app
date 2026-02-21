// ==========================================
// NotesOS Type Definitions
// ==========================================

// ---- Enums / Union Types ----

export type WorkspaceColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'yellow' | 'pink';

export type CourseType = 'course' | 'topic' | 'project' | 'certification' | 'research';
export type CourseStatus = 'active' | 'paused' | 'completed' | 'archived';
export type CourseProvider = 'udemy' | 'coursera' | 'youtube' | 'book' | 'other' | '';

export type NoteType =
	| 'lecture'
	| 'concept'
	| 'practice'
	| 'review'
	| 'cheatsheet'
	| 'buildlog'
	| 'trading'
	| 'postmortem'
	| 'general';

export type TaskStatus = 'open' | 'doing' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SourceType = 'url' | 'pdf' | 'image' | 'video' | 'quote' | 'file';

export type TabId = 'today' | 'courses' | 'library' | 'review';

// ---- Entity Interfaces ----

export interface Workspace {
	id?: number;
	name: string;
	description: string;
	color: WorkspaceColor;
	icon: string;
	createdAt: number;
	updatedAt: number;
}

export interface Course {
	id?: number;
	workspaceId: number;
	title: string;
	type: CourseType;
	status: CourseStatus;
	provider: CourseProvider;
	description: string;
	startDate: number | null;
	targetDate: number | null;
	tags: string[];
	keyConcepts: string[];
	openQuestions: string[];
	summary: string;
	createdAt: number;
	updatedAt: number;
}

export interface Note {
	id?: number;
	courseId: number | null;
	workspaceId: number | null;
	title: string;
	noteType: NoteType;
	body: string; // TipTap HTML content
	bodyPlaintext: string; // Plaintext for search indexing
	tags: string[];
	pinned: boolean;
	favorited: boolean;
	confidenceRating: number | null; // 1-5 for concept cards
	createdAt: number;
	updatedAt: number;
	lastEditedAt: number;
}

export interface NoteVersion {
	id?: number;
	noteId: number;
	title: string;
	body: string;
	createdAt: number;
}

export interface NoteLink {
	id?: number;
	sourceNoteId: number;
	targetNoteId: number;
}

export interface Session {
	id?: number;
	courseId: number | null;
	workspaceId: number | null;
	startTime: number;
	endTime: number | null;
	duration: number | null; // minutes
	summary: string;
	whatLearned: string[];
	openQuestions: string[];
	nextActions: string[];
	linkedNoteIds: number[];
	createdAt: number;
}

export interface Task {
	id?: number;
	noteId: number | null;
	courseId: number | null;
	sessionId: number | null;
	title: string;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: number | null;
	createdAt: number;
	completedAt: number | null;
}

export interface Source {
	id?: number;
	noteId: number | null;
	courseId: number | null;
	type: SourceType;
	title: string;
	url: string;
	excerpt: string;
	videoTimestamp: string; // e.g., "14:32"
	createdAt: number;
}

export interface Tag {
	id?: number;
	name: string;
	color: string;
	createdAt: number;
}

export interface NoteTagJoin {
	id?: number;
	noteId: number;
	tagId: number;
}

export interface CourseTagJoin {
	id?: number;
	courseId: number;
	tagId: number;
}

export interface SavedSearch {
	id?: number;
	name: string;
	filters: SearchFilters;
	createdAt: number;
}

export interface InboxItem {
	id?: number;
	content: string;
	tags: string[];
	courseId: number | null;
	createdAt: number;
}

export interface Module {
	id?: number;
	courseId: number;
	title: string;
	description: string;
	order: number;
	completed: boolean;
	createdAt: number;
}

// ---- Search & Filter Types ----

export interface SearchFilters {
	query: string;
	courseId: number | null;
	noteType: NoteType | null;
	tags: string[];
	dateFrom: number | null;
	dateTo: number | null;
	hasAttachments: boolean | null;
	hasTasks: boolean | null;
	pinned: boolean | null;
	favorited: boolean | null;
	confidenceRating: number | null;
}

export interface SearchResult {
	type: 'note' | 'course' | 'tag' | 'task';
	id: number;
	title: string;
	subtitle: string;
	noteType?: NoteType;
	tags?: string[];
	updatedAt?: number;
}

// ---- UI State Types ----

export interface AppState {
	activeWorkspaceId: number | null;
	activeTab: TabId;
	sidebarOpen: boolean;
	rightPanelOpen: boolean;
	commandPaletteOpen: boolean;
	activeSessionId: number | null;
	focusMode: boolean;
}

export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	duration: number;
}

// ---- Template Types ----

export interface NoteTemplate {
	type: NoteType;
	label: string;
	description: string;
	icon: string;
	defaultBody: string;
}

// ---- Command Palette ----

export interface Command {
	id: string;
	label: string;
	description: string;
	icon: string;
	shortcut?: string;
	action: () => void;
	category: 'navigation' | 'create' | 'search' | 'export' | 'settings';
}

// ---- Review Types ----

export interface WeeklyReviewData {
	notesCreated: number;
	notesEdited: number;
	conceptsAdded: number;
	tasksCompleted: number;
	sessionsLogged: number;
	totalSessionMinutes: number;
	openQuestions: string[];
	topTags: { name: string; count: number }[];
}

export interface MonthlyReviewData extends WeeklyReviewData {
	topCourses: { id: number; title: string; noteCount: number }[];
	mostReferencedNotes: { id: number; title: string; linkCount: number }[];
	completedModules: { courseTitle: string; moduleTitle: string }[];
}
