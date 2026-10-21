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

export interface DateParts {
  month: string; // Nov
  day: string; // 10
  time: string; // 3:00 PM
  // Solo si no es el año actual, para no confundir noviembre de este año con el del siguiente
  year: string | null;
}

/** Partes de la fecha para el bloque de fecha de las tarjetas, en hora local. */
export function formatDateParts(iso: string): DateParts {
  const date = parseISO(iso);
  const year = date.getFullYear() === new Date().getFullYear() ? null : format(date, 'yyyy');
  return { month: format(date, 'MMM'), day: format(date, 'd'), time: format(date, TIME), year };
}
