import type { Command } from '$lib/types';

let commands = $state<Command[]>([]);
let isOpen = $state(false);
let searchQuery = $state('');

export function getCommandPaletteState() {
	return {
		get commands() { return commands; },
		get isOpen() { return isOpen; },
		get searchQuery() { return searchQuery; }
	};
}

export function registerCommands(newCommands: Command[]): void {
	commands = newCommands;
}

export function openCommandPalette(): void {
	isOpen = true;
	searchQuery = '';
}

export function closeCommandPalette(): void {
	isOpen = false;
	searchQuery = '';
}

export function toggleCommandPalette(): void {
	if (isOpen) {
		closeCommandPalette();
	} else {
		openCommandPalette();
	}
}

export function setSearchQuery(query: string): void {
	searchQuery = query;
}

export function getFilteredCommands(): Command[] {
	if (!searchQuery.trim()) return commands;
	const lower = searchQuery.toLowerCase();
	return commands.filter(
		(c) =>
			c.label.toLowerCase().includes(lower) ||
			c.description.toLowerCase().includes(lower) ||
			c.category.toLowerCase().includes(lower)
	);
}
