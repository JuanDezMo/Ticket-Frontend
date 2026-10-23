import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useReserveSeat } from '@/features/reservations';
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

/**
 * Reserva el seat elegido. Con éxito limpia la selección, actualiza el mapa y lleva al checkout;
 * con un error avisa y, si el seat o el evento cambiaron, actualiza lo que corresponda.
 */
export function useReserveSelection(eventId: string, onEventNotActive: () => void) {
  const reserve = useReserveSeat();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clear = useSeatSelectionStore((state) => state.clear);
  const releaseUnavailable = useSeatSelectionStore((state) => state.releaseUnavailable);
  // Evita una segunda solicitud antes de que React deshabilite el botón
  const inFlight = useRef(false);

  const refreshSeats = () => queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(eventId) });

  const submit = (seat: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    reserve.mutate(
      { eventId, seat },
      {
        onSuccess: (reservation) => {
          clear();
          void refreshSeats();
          navigate(ROUTES.checkout(reservation.id));
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
          const code = error instanceof ApiError ? error.code : null;
          if (code === ERROR_CODES.SEAT_NOT_AVAILABLE) {
            releaseUnavailable();
            void refreshSeats();
          } else if (code === ERROR_CODES.EVENT_NOT_ACTIVE) {
            void refreshSeats();
            onEventNotActive();
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
