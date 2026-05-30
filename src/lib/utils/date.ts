import {
	format,
	formatDistanceToNow,
	isToday,
	isYesterday,
	isThisWeek,
	isThisMonth,
	startOfDay,
	endOfDay,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	subDays,
	subWeeks,
	differenceInMinutes
} from 'date-fns';

export function formatDate(ts: number): string {
	return format(new Date(ts), 'MMM d, yyyy');
}

export function formatDateTime(ts: number): string {
	return format(new Date(ts), 'MMM d, yyyy h:mm a');
}

export function formatTime(ts: number): string {
	return format(new Date(ts), 'h:mm a');
}

export function formatRelative(ts: number): string {
	const date = new Date(ts);
	if (isToday(date)) return 'Today ' + format(date, 'h:mm a');
	if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
	if (isThisWeek(date)) return format(date, 'EEEE h:mm a');
	return format(date, 'MMM d, yyyy');
}

export function formatTimeAgo(ts: number): string {
	return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

export function formatDuration(minutes: number): string {
	if (minutes < 60) return `${minutes}m`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getDurationMinutes(start: number, end: number): number {
	return differenceInMinutes(new Date(end), new Date(start));
}

export function getWeekRange(): { start: number; end: number } {
	const now = new Date();
	return {
		start: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
		end: endOfWeek(now, { weekStartsOn: 1 }).getTime()
	};
}

export function getMonthRange(): { start: number; end: number } {
	const now = new Date();
	return {
		start: startOfMonth(now).getTime(),
		end: endOfMonth(now).getTime()
	};
}

export function getTodayRange(): { start: number; end: number } {
	const now = new Date();
	return {
		start: startOfDay(now).getTime(),
		end: endOfDay(now).getTime()
	};
}

export function getLast7DaysRange(): { start: number; end: number } {
	return {
		start: subDays(new Date(), 7).getTime(),
		end: Date.now()
	};
}

export function getLast30DaysRange(): { start: number; end: number } {
	return {
		start: subDays(new Date(), 30).getTime(),
		end: Date.now()
	};
}

export { isToday, isYesterday, isThisWeek, isThisMonth, subDays, subWeeks };
