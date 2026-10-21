import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSessionStore } from '@/shared/session/session.store';
import { seatsApi } from './api';
import { seatKeys } from './query-keys';
import { useSeatSelectionStore } from './store';
import { SEAT_STATUSES, type Seat } from './types';

/** Seats del evento; solo se consultan con sesión (la API exige token). */
export function useEventSeats(eventId: string) {
  const role = useSessionStore((state) => state.role);
  return useQuery({
    queryKey: seatKeys.byEvent(eventId),
    queryFn: () => seatsApi.listByEvent(eventId),
    enabled: !!role,
    // Cambian seguido: siempre se vuelven a pedir al entrar
    staleTime: 0,
  });
}

/**
 * Selección vigente para este evento. Si el seat guardado ya no está disponible
 * (otro usuario lo reservó), se quita y queda el aviso en `lostSeatLabel`.
 */
export function useSelectedSeat(eventId: string, seats: Seat[] | undefined) {
  const selectedLabel = useSeatSelectionStore((state) =>
    state.eventId === eventId ? state.seatLabel : null,
  );
  const lostSeatLabel = useSeatSelectionStore((state) =>
    state.eventId === eventId ? state.lostSeatLabel : null,
  );
  const releaseUnavailable = useSeatSelectionStore((state) => state.releaseUnavailable);

  const selectedSeat = seats?.find((seat) => seat.label === selectedLabel);
  const noLongerAvailable =
    !!selectedLabel && !!seats && selectedSeat?.status !== SEAT_STATUSES.AVAILABLE;

  useEffect(() => {
    if (noLongerAvailable) releaseUnavailable();
  }, [noLongerAvailable, releaseUnavailable]);

  return { selectedLabel: noLongerAvailable ? null : selectedLabel, lostSeatLabel };
}
