import { format, isSameDay, parseISO } from 'date-fns';

// La API envía fechas ISO 8601 en UTC; se muestran en la zona horaria del navegador
const DATE_TIME = 'PPp'; // Dec 1, 2026, 8:00 PM
const TIME = 'p'; // 8:00 PM

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), DATE_TIME);
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const endFormat = isSameDay(start, end) ? TIME : DATE_TIME;
  return `${format(start, DATE_TIME)} – ${format(end, endFormat)}`;
}
