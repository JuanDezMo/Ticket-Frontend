import { ROLES, type Role } from '@/shared/session/roles';
import { SEAT_STATUSES, type Seat } from './types';

interface SelectionContext {
  role: Role | null;
  // false si el evento está cancelado o ya inició
  eventBookable: boolean;
}

/** Solo un USER elige seats, y solo en eventos reservables. */
export function canSelectSeats({ role, eventBookable }: SelectionContext): boolean {
  return role === ROLES.USER && eventBookable;
}

/** Además, el seat tiene que estar disponible. */
export function canSelectSeat(seat: Seat, context: SelectionContext): boolean {
  return canSelectSeats(context) && seat.status === SEAT_STATUSES.AVAILABLE;
}
