import { differenceInDays, differenceInHours, differenceInMinutes, format, isToday, isYesterday } from 'date-fns';

const ARCHIVE_THRESHOLD_DAYS = 30;

export function formatMessageTime(date: Date): string {
  const now = new Date();
  const minutesAgo = differenceInMinutes(now, date);
  const hoursAgo = differenceInHours(now, date);

  if (minutesAgo < 1) return 'Nu';
  if (minutesAgo < 60) return `${minutesAgo} min`;
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'I går';
  return format(date, 'd. MMM');
}

export function isArchived(lastMessageDate: Date): boolean {
  return differenceInDays(new Date(), lastMessageDate) > ARCHIVE_THRESHOLD_DAYS;
}
