import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useReserveSeats } from '@/features/reservations';
import { ApiError, ERROR_CODES } from '@/shared/api/api-error';
import { getErrorMessage } from '@/shared/api/error-messages';
import { ROUTES } from '@/shared/config/routes';
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
 * Selección vigente para este evento. Los seats guardados que ya no están disponibles (otro
 * usuario los reservó) se quitan, los demás se conservan, y quedan en `lostSeatLabels` para avisar.
 */
export function useSelectedSeats(eventId: string, seats: Seat[] | undefined) {
  const savedLabels = useSeatSelectionStore((state) =>
    state.eventId === eventId ? state.seatLabels : NO_LABELS,
  );
  const lostSeatLabels = useSeatSelectionStore((state) =>
    state.eventId === eventId ? state.lostSeatLabels : NO_LABELS,
  );
  const releaseUnavailable = useSeatSelectionStore((state) => state.releaseUnavailable);

  const unavailable = seats
    ? savedLabels.filter(
        (label) => seats.find((seat) => seat.label === label)?.status !== SEAT_STATUSES.AVAILABLE,
      )
    : NO_LABELS;
  const unavailableKey = unavailable.join(',');

  useEffect(() => {
    if (unavailableKey) releaseUnavailable(unavailableKey.split(','));
  }, [unavailableKey, releaseUnavailable]);

  return {
    selectedLabels: savedLabels.filter((label) => !unavailable.includes(label)),
    lostSeatLabels,
  };
}

const NO_LABELS: string[] = [];

function seatLimitMessage(max: number): string {
  return `You can hold up to ${max} ${max === 1 ? 'seat' : 'seats'} for this event`;
}

/**
 * Reserva los seats elegidos en una sola solicitud. Con éxito limpia la selección, actualiza el
 * mapa y lleva al checkout de la primera reserva; con un error avisa y actualiza lo que cambió.
 */
export function useReserveSelection(
  eventId: string,
  maxSeatsPerUser: number,
  onEventNotActive: () => void,
) {
  const reserve = useReserveSeats();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clear = useSeatSelectionStore((state) => state.clear);
  // Evita una segunda solicitud antes de que React deshabilite el botón
  const inFlight = useRef(false);

  const refreshSeats = () => queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(eventId) });

  const submit = (seats: string[]) => {
    if (inFlight.current || seats.length === 0) return;
    inFlight.current = true;
    reserve.mutate(
      { eventId, seats },
      {
        onSuccess: (reservations) => {
          clear();
          void refreshSeats();
          const [first] = reservations;
          if (first) navigate(ROUTES.checkout(first.id));
        },
        onError: (error) => {
          const code = error instanceof ApiError ? error.code : null;
          // El número sale del evento, no del texto de la API
          toast.error(
            code === ERROR_CODES.SEAT_LIMIT_REACHED
              ? seatLimitMessage(maxSeatsPerUser)
              : getErrorMessage(error),
          );
          if (code === ERROR_CODES.EVENT_NOT_ACTIVE) {
            void refreshSeats();
            onEventNotActive();
          } else if (
            code === ERROR_CODES.SEAT_NOT_AVAILABLE ||
            code === ERROR_CODES.SEAT_LIMIT_REACHED ||
            code === ERROR_CODES.HOLD_LIMIT_REACHED
          ) {
            // La selección se conserva; el mapa nuevo quita los seats que ya no están disponibles
            void refreshSeats();
          }
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return { reserve: submit, reserving: reserve.isPending };
}
