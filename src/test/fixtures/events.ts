import type { Event } from '@/features/events/types';
import type { Seat, SeatStatus } from '@/features/seats/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const SEATS_PER_ROW = 10;
const FIRST_ROW_CODE = 'A'.charCodeAt(0);

let sequence = 0;

export function daysFromNow(days: number, hours = 0): string {
  return new Date(Date.now() + days * DAY_MS + hours * HOUR_MS).toISOString();
}

export function makeEvent(overrides: Partial<Event> = {}): Event {
  sequence += 1;
  return {
    id: crypto.randomUUID(),
    name: `Event ${sequence}`,
    description: 'A great event',
    type: 'CONCERT',
    venue: 'Main Hall',
    price: 150,
    capacity: 20,
    startDate: daysFromNow(30),
    endDate: daysFromNow(30, 3),
    createdAt: daysFromNow(-1),
    status: 'ACTIVE',
    ...overrides,
  };
}

/** Genera los seats igual que la API: filas A.. de 10 puestos. */
export function makeSeats(
  capacity: number,
  statusByLabel: Record<string, SeatStatus> = {},
): Seat[] {
  return Array.from({ length: capacity }, (_, index) => {
    const row = String.fromCharCode(FIRST_ROW_CODE + Math.floor(index / SEATS_PER_ROW));
    const number = (index % SEATS_PER_ROW) + 1;
    const label = `${row}${number}`;
    return {
      id: crypto.randomUUID(),
      row,
      number,
      label,
      status: statusByLabel[label] ?? 'AVAILABLE',
    };
  });
}
