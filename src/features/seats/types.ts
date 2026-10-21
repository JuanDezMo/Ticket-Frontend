export const SEAT_STATUSES = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
  BLOCKED: 'BLOCKED',
} as const;
export type SeatStatus = (typeof SEAT_STATUSES)[keyof typeof SEAT_STATUSES];

// Formato de GET /events/:id/seats
export interface Seat {
  id: string;
  row: string;
  number: number;
  label: string;
  status: SeatStatus;
}

export interface SeatList {
  eventId: string;
  data: Seat[];
}

export interface SeatRow {
  row: string;
  seats: Seat[];
}
