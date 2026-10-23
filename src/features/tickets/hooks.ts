import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { ticketsApi } from './api';
import { ticketKeys } from './query-keys';
import type { PurchaseRequest } from './types';

export const MY_TICKETS_PAGE_SIZE = 12;

/**
 * Pago de una reserva. La tarjeta no queda en la caché: la mutación no se conserva (`gcTime: 0`)
 * y se reinicia al terminar. Una segunda llamada mientras hay un pago en curso se ignora.
 */
export function usePurchase() {
  const { mutateAsync, reset, isPending } = useMutation({
    mutationFn: ticketsApi.purchase,
    gcTime: 0,
  });
  const inFlight = useRef(false);

  const pay = useCallback(
    async (request: PurchaseRequest) => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      try {
        return await mutateAsync(request);
      } finally {
        inFlight.current = false;
        reset();
      }
    },
    [mutateAsync, reset],
  );

  return { pay, isPending };
}

export function useMyTickets(page: number) {
  const query = { page, pageSize: MY_TICKETS_PAGE_SIZE };
  return useQuery({
    queryKey: ticketKeys.mine(query),
    queryFn: () => ticketsApi.listMine(query),
    placeholderData: keepPreviousData,
  });
}

const PAGE_PARAM = 'page';
const FIRST_PAGE = 1;

/** Página de "My tickets", guardada en la URL (`page`). */
export function useTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = Number(searchParams.get(PAGE_PARAM));
  const page = Number.isInteger(value) && value >= FIRST_PAGE ? value : FIRST_PAGE;

  const setPage = useCallback(
    (next: number) => setSearchParams(next === FIRST_PAGE ? {} : { [PAGE_PARAM]: String(next) }),
    [setSearchParams],
  );

  return { page, setPage };
}
