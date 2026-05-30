/**
 * Platform detection utilities for Tauri desktop vs browser environment.
 * When running inside Tauri, we can use native APIs (file dialogs, shell, etc.)
 * When running in the browser, we fall back to web APIs.
 */

/**
 * Check if the app is running inside a Tauri desktop environment.
 */
export function isTauri(): boolean {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Open a URL in the system's default browser.
 * Falls back to window.open in browser environments.
 */
export async function openExternal(url: string): Promise<void> {
	if (isTauri()) {
		const { open } = await import('@tauri-apps/plugin-shell');
		await open(url);
	} else {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
}

/**
 * Save a file using a native dialog (Tauri) or browser download (web).
 */
export async function saveFile(
	content: string,
	defaultFilename: string,
	filters?: { name: string; extensions: string[] }[]
): Promise<void> {
	if (isTauri()) {
		const { save } = await import('@tauri-apps/plugin-dialog');
		const { writeTextFile } = await import('@tauri-apps/plugin-fs');
		const filePath = await save({
			defaultPath: defaultFilename,
			filters: filters ?? [{ name: 'All Files', extensions: ['*'] }]
		});
		if (filePath) {
			await writeTextFile(filePath, content);
		}
	} else {
		// Browser fallback: trigger download
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = defaultFilename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}

/**
 * Open a file using a native dialog (Tauri) or file input (web).
 * Returns file content as string, or null if cancelled.
 */
export async function openFile(
	filters?: { name: string; extensions: string[] }[]
): Promise<string | null> {
	if (isTauri()) {
		const { open } = await import('@tauri-apps/plugin-dialog');
		const { readTextFile } = await import('@tauri-apps/plugin-fs');
		const filePath = await open({
			multiple: false,
			filters: filters ?? [{ name: 'All Files', extensions: ['*'] }]
		});
		if (filePath) {
			return await readTextFile(filePath as string);
		}
		return null;
	} else {
		// Browser fallback: file input
		return new Promise((resolve) => {
			const input = document.createElement('input');
			input.type = 'file';
			if (filters && filters.length > 0) {
				input.accept = filters
					.flatMap((f) => f.extensions.map((ext) => `.${ext}`))
					.join(',');
			}
			input.onchange = async () => {
				const file = input.files?.[0];
				if (file) {
					const text = await file.text();
					resolve(text);
				} else {
					resolve(null);
				}
			};
			// Resolve null on cancel — file dialogs don't fire onchange when cancelled,
			// so we listen for window focus returning after the dialog closes
			const onFocus = () => {
				setTimeout(() => {
					if (!input.files?.length) resolve(null);
				}, 300);
				window.removeEventListener('focus', onFocus);
			};
			window.addEventListener('focus', onFocus);
			input.click();
		});
	}
}
