export const RESERVATION_STATUSES = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CONFIRMED: 'CONFIRMED',
  // El evento se canceló
  CANCELLED: 'CANCELLED',
  // La canceló su dueño
  CANCELLED_BY_USER: 'CANCELLED_BY_USER',
} as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[keyof typeof RESERVATION_STATUSES];

// Formato de GET /reservations/:id y POST /reservations/:id/cancel,
// y de cada elemento de POST /reservations
export interface Reservation {
  id: string;
  eventId: string;
  seatId: string;
  seat: string;
  status: ReservationStatus;
  amount: number;
  expiresAt: string;
  createdAt: string;
}

// Respuesta de POST /reservations: una reserva por seat, en el orden pedido
export interface ReservationBatch {
  reservations: Reservation[];
}
