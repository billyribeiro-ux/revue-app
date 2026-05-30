import type { AppState, TabId, ToastMessage } from '$lib/types';
import { generateId } from '$lib/utils/id';

// Global app state using Svelte 5 runes
let state = $state<AppState>({
	activeWorkspaceId: null,
	activeTab: 'today',
	sidebarOpen: true,
	rightPanelOpen: false,
	commandPaletteOpen: false,
	activeSessionId: null,
	focusMode: false
});

let dbReady = $state(false);

export function isDbReady(): boolean {
	return dbReady;
}

export function setDbReady(ready: boolean): void {
	dbReady = ready;
}

let toasts = $state<ToastMessage[]>([]);

export function getAppState(): AppState {
	return state;
}

export function setActiveWorkspace(id: number | null): void {
	state.activeWorkspaceId = id;
}

export function setActiveTab(tab: TabId): void {
	state.activeTab = tab;
}

export function toggleSidebar(): void {
	state.sidebarOpen = !state.sidebarOpen;
}

export function setSidebarOpen(open: boolean): void {
	state.sidebarOpen = open;
}

export function toggleRightPanel(): void {
	state.rightPanelOpen = !state.rightPanelOpen;
}

export function setRightPanelOpen(open: boolean): void {
	state.rightPanelOpen = open;
}

export function toggleCommandPalette(): void {
	state.commandPaletteOpen = !state.commandPaletteOpen;
}

export function setCommandPaletteOpen(open: boolean): void {
	state.commandPaletteOpen = open;
}

export function setActiveSession(id: number | null): void {
	state.activeSessionId = id;
}

export function toggleFocusMode(): void {
	state.focusMode = !state.focusMode;
}

// Toast notifications
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function getToasts(): ToastMessage[] {
	return toasts;
}

export function addToast(type: ToastMessage['type'], message: string, duration: number = 3000): void {
	const id = generateId();
	toasts.push({ id, type, message, duration });
	if (duration > 0) {
		toastTimers.set(id, setTimeout(() => removeToast(id), duration));
	}
}

export function removeToast(id: string): void {
	const timer = toastTimers.get(id);
	if (timer) {
		clearTimeout(timer);
		toastTimers.delete(id);
	}
	toasts = toasts.filter((t) => t.id !== id);
}
