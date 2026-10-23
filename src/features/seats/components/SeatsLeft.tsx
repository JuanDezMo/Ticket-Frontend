import { useEventSeats } from '../hooks';
import { SEAT_STATUSES } from '../types';

interface SeatsLeftProps {
  eventId: string;
  // Lo que se muestra mientras no hay datos de seats (carga o error)
  fallback: string;
}

/** Cuántos seats quedan. Comparte la consulta con el mapa, así que no pide nada extra. */
export function SeatsLeft({ eventId, fallback }: SeatsLeftProps) {
  const seats = useEventSeats(eventId).data?.data;
  if (!seats) return <>{fallback}</>;
  const available = seats.filter((seat) => seat.status === SEAT_STATUSES.AVAILABLE).length;
  return <>{available} left</>;
}
