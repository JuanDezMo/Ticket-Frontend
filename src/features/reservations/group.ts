import { RESERVATION_STATUSES, type Reservation } from './types';

const CENTS = 100;

export interface GroupCheckout {
  // Las que se pueden pagar, en el orden del enlace
  payable: Reservation[];
  // Las que ya no: vencidas, canceladas o pagadas
  ended: Reservation[];
  // Suma de las pagables, en centavos enteros
  total: number;
  // La pagable que vence primero
  soonest: Reservation | undefined;
  // Una compra es de un solo evento
  sameEvent: boolean;
}

/** Qué se puede pagar de un grupo de reservas, según el estado que informa la API. */
export function groupCheckout(reservations: readonly Reservation[]): GroupCheckout {
  const payable = reservations.filter(
    (reservation) => reservation.status === RESERVATION_STATUSES.ACTIVE,
  );
  const ended = reservations.filter(
    (reservation) => reservation.status !== RESERVATION_STATUSES.ACTIVE,
  );
  const cents = payable.reduce(
    (sum, reservation) => sum + Math.round(reservation.amount * CENTS),
    0,
  );
  const soonest = [...payable].sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
  )[0];
  return {
    payable,
    ended,
    total: cents / CENTS,
    soonest,
    sameEvent: new Set(reservations.map((reservation) => reservation.eventId)).size <= 1,
  };
}
