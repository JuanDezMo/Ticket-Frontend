import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError } from '@/shared/api/api-error';
import { isUuid } from '@/shared/lib/is-uuid';
import { reservationsApi } from './api';
import { useHoldStore } from './hold.store';
import { reservationKeys } from './query-keys';
import { RESERVATION_STATUSES, type Reservation } from './types';

// Detecta una cancelación o un pago hecho en otra pestaña
const REFETCH_INTERVAL_MS = 30_000;
// Reserva inexistente o de otro usuario
const GONE_STATUSES = [403, 404];

/** Reserva por id, con el estado efectivo que informa la API. */
export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: reservationKeys.detail(id ?? ''),
    queryFn: () => reservationsApi.getById(id as string),
    enabled: isUuid(id),
    refetchInterval: (query) =>
      query.state.data?.status === RESERVATION_STATUSES.ACTIVE ? REFETCH_INTERVAL_MS : false,
  });
}

/** Crea la reserva; quien la usa decide qué hacer con el resultado. */
export function useReserveSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, seat }: { eventId: string; seat: string }) =>
      reservationsApi.create(eventId, seat),
    onSuccess: (reservation: Reservation) => {
      useHoldStore.getState().start(reservation);
      queryClient.setQueryData(reservationKeys.detail(reservation.id), reservation);
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsApi.cancel(id),
    onSuccess: (reservation) => {
      queryClient.setQueryData(reservationKeys.detail(reservation.id), reservation);
    },
  });
}

/**
 * Reserva en curso del usuario. El store solo sabe qué consultar: la API decide, y una
 * reserva que ya no está `ACTIVE` (vencida, cancelada o pagada) se descarta.
 */
export function useHold() {
  const hold = useHoldStore((state) => state.hold);
  const clear = useHoldStore((state) => state.clear);
  const reservation = useReservation(hold?.reservationId);
  const status = reservation.data?.status;
  const settled = !!status && status !== RESERVATION_STATUSES.ACTIVE;

  // Un 404 o 403 también significa que ya no hay nada que retener
  const error = reservation.error;
  const notMine = error instanceof ApiError && GONE_STATUSES.includes(error.status);

  useEffect(() => {
    if (settled || notMine) clear();
  }, [settled, notMine, clear]);

  return settled || notMine ? null : hold;
}
