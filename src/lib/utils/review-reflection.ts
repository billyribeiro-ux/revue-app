import { format } from 'date-fns';
import { startOfWeek } from 'date-fns';

const STORAGE_PREFIX = 'notesos-review-reflection-';

function getWeeklyKey(): string {
	const now = new Date();
	const weekStart = startOfWeek(now, { weekStartsOn: 1 });
	return `${STORAGE_PREFIX}weekly-${format(weekStart, 'yyyy-MM-dd')}`;
}

function getMonthlyKey(): string {
	const now = new Date();
	return `${STORAGE_PREFIX}monthly-${format(now, 'yyyy-MM')}`;
}

export interface ReviewReflectionData {
	whatClicked: string;
	whatDidntClick: string;
	whatToRevisit: string;
	planForNext: string;
}

const DEFAULT: ReviewReflectionData = {
	whatClicked: '',
	whatDidntClick: '',
	whatToRevisit: '',
	planForNext: ''
};

export function getReflectionKey(isWeekly: boolean): string {
	return isWeekly ? getWeeklyKey() : getMonthlyKey();
}

export function loadReflection(isWeekly: boolean): ReviewReflectionData {
	try {
		const key = getReflectionKey(isWeekly);
		const stored = localStorage.getItem(key);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<ReviewReflectionData>;
			return { ...DEFAULT, ...parsed };
		}
	} catch {
		// ignore parse errors
	}
	return { ...DEFAULT };
}

export function saveReflection(isWeekly: boolean, data: ReviewReflectionData): void {
	try {
		const key = getReflectionKey(isWeekly);
		localStorage.setItem(key, JSON.stringify(data));
	} catch {
		// ignore quota errors
	}
}
