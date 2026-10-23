import type { Reservation } from '@/features/reservations/types';
import type { MyTicket } from '@/features/tickets/types';

const MINUTE_MS = 60 * 1000;

export function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * MINUTE_MS).toISOString();
}

/** Reserva `ACTIVE` que vence en 10 minutos, salvo lo que se cambie. */
export function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    seatId: crypto.randomUUID(),
    seat: 'C7',
    status: 'ACTIVE',
    amount: 49.99,
    createdAt: minutesFromNow(0),
    expiresAt: minutesFromNow(10),
    ...overrides,
  };
}

export function makeTicket(overrides: Partial<MyTicket> = {}): MyTicket {
  return {
    id: crypto.randomUUID(),
    status: 'ISSUED',
    seat: 'C7',
    amount: 49.99,
    issuedAt: minutesFromNow(-5),
    event: {
      id: crypto.randomUUID(),
      name: 'Rock Night',
      venue: 'Main Hall',
      startDate: minutesFromNow(60 * 24 * 30),
    },
    ...overrides,
  };
}
