type ShortcutHandler = () => void;

interface Shortcut {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	meta?: boolean;
	handler: ShortcutHandler;
	description: string;
}

const shortcuts: Shortcut[] = [];

export function registerShortcut(shortcut: Shortcut): () => void {
	shortcuts.push(shortcut);
	return () => {
		const idx = shortcuts.indexOf(shortcut);
		if (idx !== -1) shortcuts.splice(idx, 1);
	};
}

export function handleKeydown(event: KeyboardEvent): void {
	// Don't trigger shortcuts when typing in inputs
	const target = event.target as HTMLElement;
	if (
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.getAttribute('contenteditable') === 'true'
	) {
		// Allow certain global shortcuts even in inputs
		const isGlobalShortcut =
			(event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K');
		if (!isGlobalShortcut) return;
	}

	for (const shortcut of shortcuts) {
		const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
		const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
		const altMatch = shortcut.alt ? event.altKey : !event.altKey;

		if (event.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
			event.preventDefault();
			shortcut.handler();
			return;
		}
	}
}

export function getShortcuts(): { key: string; description: string; display: string }[] {
	return shortcuts.map((s) => {
		const parts: string[] = [];
		if (s.ctrl) parts.push('Ctrl');
		if (s.shift) parts.push('Shift');
		if (s.alt) parts.push('Alt');
		parts.push(s.key.toUpperCase());
		return {
			key: s.key,
			description: s.description,
			display: parts.join(' + ')
		};
	});
}
