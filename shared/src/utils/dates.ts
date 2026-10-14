const dayMilliseconds = 86_400_000;

export function communityToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function durationInDays(start: string, end: string): number {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / dayMilliseconds + 1;
}

export function isAllowedDuration(days: number): boolean {
  return Number.isInteger(days) && days >= 1 && days <= 14;
}

export function calendarDays(start: string, end: string): string[] {
  const duration = durationInDays(start, end);
  if (!isCalendarDate(start) || !isCalendarDate(end) || !isAllowedDuration(duration)) {
    throw new Error('Invalid borrowing dates');
  }
  return Array.from({ length: duration }, (_, index) =>
    new Date(Date.parse(`${start}T00:00:00Z`) + index * dayMilliseconds).toISOString().slice(0, 10),
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}
