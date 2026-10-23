import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError } from '@/shared/api/api-error';
import { isUuid } from '@/shared/lib/is-uuid';
import { reservationsApi } from './api';
import { useHoldStore, type Hold } from './hold.store';
import { reservationKeys } from './query-keys';
import { RESERVATION_STATUSES, type Reservation } from './types';

// Detecta una cancelación o un pago hecho en otra pestaña
const REFETCH_INTERVAL_MS = 30_000;
// Reserva inexistente o de otro usuario
const GONE_STATUSES = [403, 404];

// Mientras está activa se vuelve a consultar; después ya no cambia
const refetchWhileActive = (query: { state: { data?: Reservation } }) =>
  query.state.data?.status === RESERVATION_STATUSES.ACTIVE ? REFETCH_INTERVAL_MS : false;

/** Reserva por id, con el estado efectivo que informa la API. */
export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: reservationKeys.detail(id ?? ''),
    queryFn: () => reservationsApi.getById(id as string),
    enabled: isUuid(id),
    refetchInterval: refetchWhileActive,
  });
}

/** Reserva los seats de la lista en una sola solicitud (todo o nada). */
export function useReserveSeats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, seats }: { eventId: string; seats: string[] }) =>
      reservationsApi.create(eventId, seats),
    onSuccess: (reservations) => {
      useHoldStore.getState().add(reservations);
      for (const reservation of reservations) {
        queryClient.setQueryData(reservationKeys.detail(reservation.id), reservation);
      }
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
 * Reservas en curso del usuario, la que vence primero antes. El store solo sabe qué consultar:
 * la API decide, y cada reserva que ya no está `ACTIVE` (vencida, cancelada o pagada) se
 * descarta sola, sin afectar a las demás.
 */
export function useHolds(): Hold[] {
  const holds = useHoldStore((state) => state.holds);
  const remove = useHoldStore((state) => state.remove);
  const results = useQueries({
    queries: holds.map((hold) => ({
      queryKey: reservationKeys.detail(hold.reservationId),
      queryFn: () => reservationsApi.getById(hold.reservationId),
      enabled: isUuid(hold.reservationId),
      refetchInterval: refetchWhileActive,
    })),
  });

  const gone = holds.filter((_, index) => {
    const result = results[index];
    const status = result?.data?.status;
    const settled = !!status && status !== RESERVATION_STATUSES.ACTIVE;
    // Un 404 o 403 también significa que ya no hay nada que retener
    const notMine =
      result?.error instanceof ApiError && GONE_STATUSES.includes(result.error.status);
    return settled || notMine;
  });
  const goneKey = gone.map((hold) => hold.reservationId).join(',');

  useEffect(() => {
    if (goneKey) goneKey.split(',').forEach(remove);
  }, [goneKey, remove]);

  return holds
    .filter((hold) => !gone.includes(hold))
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
}
