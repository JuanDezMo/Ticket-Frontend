import type { Seat, SeatRow } from './types';

/** Agrupa los seats por fila respetando el orden que entrega la API (A1, A2...). */
export function groupSeatsByRow(seats: Seat[]): SeatRow[] {
  const rows: SeatRow[] = [];
  for (const seat of seats) {
    const last = rows.at(-1);
    if (last && last.row === seat.row) {
      last.seats.push(seat);
    } else {
      rows.push({ row: seat.row, seats: [seat] });
    }
  }
  return rows;
}
