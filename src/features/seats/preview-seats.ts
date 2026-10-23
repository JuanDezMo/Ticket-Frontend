import { SEAT_STATUSES, type Seat } from './types';

const SEATS_PER_ROW = 10;
const FIRST_ROW_CODE = 'A'.charCodeAt(0);
export const MIN_PREVIEW_CAPACITY = 1;
// Filas A a Z de 10: el tope de ticket-api
export const MAX_PREVIEW_CAPACITY = 260;

/** Una capacidad que ticket-api acepta: entero de 1 a 260. */
export function isPreviewCapacity(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_PREVIEW_CAPACITY && value <= MAX_PREVIEW_CAPACITY;
}

/** Los seats que la API generaría para esa capacidad: filas de 10 desde la A, la última incompleta. */
export function previewSeats(capacity: number): Seat[] {
  if (!isPreviewCapacity(capacity)) return [];
  return Array.from({ length: capacity }, (_, index) => {
    const row = String.fromCharCode(FIRST_ROW_CODE + Math.floor(index / SEATS_PER_ROW));
    const number = (index % SEATS_PER_ROW) + 1;
    return {
      id: `preview-${row}${number}`,
      row,
      number,
      label: `${row}${number}`,
      status: SEAT_STATUSES.AVAILABLE,
    };
  });
}
