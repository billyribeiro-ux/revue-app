import { db } from '$lib/db';
import { exportAllToJson, downloadFile } from './export';
import { openFile } from './platform';

export async function createBackup(): Promise<void> {
	const json = await exportAllToJson();
	const date = new Date().toISOString().split('T')[0];
	downloadFile(json, `notesos-backup-${date}.json`, 'application/json');
}

/**
 * Open a native file dialog and restore backup from the selected file.
 * Works in both Tauri desktop and browser environments.
 */
export async function restoreFromDialog(): Promise<{ success: boolean; message: string }> {
	const text = await openFile([{ name: 'JSON Files', extensions: ['json'] }]);
	if (!text) {
		return { success: false, message: 'No file selected' };
	}
	return restoreFromBackupText(text);
}

/**
 * Restore a backup from a File object (browser file input).
 */
export async function restoreFromBackup(file: File): Promise<{ success: boolean; message: string }> {
	const text = await file.text();
	return restoreFromBackupText(text);
}

/**
 * Restore a backup from a JSON string.
 */
export async function restoreFromBackupText(text: string): Promise<{ success: boolean; message: string }> {
	try {
		const data = JSON.parse(text);

		if (!data.version || !data.exportedAt) {
			return { success: false, message: 'Invalid backup file format' };
		}

		await db.transaction(
			'rw',
			[
				db.workspaces,
				db.courses,
				db.notes,
				db.noteVersions,
				db.noteLinks,
				db.sessions,
				db.tasks,
				db.sources,
				db.tags,
				db.savedSearches,
				db.inboxItems,
				db.modules
			],
			async () => {
				// Clear existing data
				await db.workspaces.clear();
				await db.courses.clear();
				await db.notes.clear();
				await db.noteVersions.clear();
				await db.noteLinks.clear();
				await db.sessions.clear();
				await db.tasks.clear();
				await db.sources.clear();
				await db.tags.clear();
				await db.savedSearches.clear();
				await db.inboxItems.clear();
				await db.modules.clear();

				// Restore data
				if (data.workspaces?.length) await db.workspaces.bulkAdd(data.workspaces);
				if (data.courses?.length) await db.courses.bulkAdd(data.courses);
				if (data.notes?.length) await db.notes.bulkAdd(data.notes);
				if (data.noteVersions?.length) await db.noteVersions.bulkAdd(data.noteVersions);
				if (data.noteLinks?.length) await db.noteLinks.bulkAdd(data.noteLinks);
				if (data.sessions?.length) await db.sessions.bulkAdd(data.sessions);
				if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
				if (data.sources?.length) await db.sources.bulkAdd(data.sources);
				if (data.tags?.length) await db.tags.bulkAdd(data.tags);
				if (data.savedSearches?.length) await db.savedSearches.bulkAdd(data.savedSearches);
				if (data.inboxItems?.length) await db.inboxItems.bulkAdd(data.inboxItems);
				if (data.modules?.length) await db.modules.bulkAdd(data.modules);
			}
		);

		return {
			success: true,
			message: `Restored backup from ${data.exportedAt}. ${data.notes?.length || 0} notes, ${data.courses?.length || 0} courses.`
		};
	} catch (err) {
		return { success: false, message: `Failed to restore backup: ${err}` };
	}
}
