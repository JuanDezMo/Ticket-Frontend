import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { eventsApi } from './api';
import { isDateRangeValid, parseFilters, parsePage, toApiQuery, toSearchParams } from './filters';
import { eventKeys } from './query-keys';
import { isEventId } from './schemas';
import type { EventFilters } from './types';

const FIRST_PAGE = 1;

/** Filtros y página del listado, guardados en la URL. */
export function useEventFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const page = parsePage(searchParams);

  // Cambiar un filtro siempre vuelve a la página 1
  const setFilter = useCallback(
    <K extends keyof EventFilters>(key: K, value: EventFilters[K]) =>
      setSearchParams((current) =>
        toSearchParams({ ...parseFilters(current), [key]: value || undefined }, FIRST_PAGE),
      ),
    [setSearchParams],
  );

  const setPage = useCallback(
    (next: number) => setSearchParams((current) => toSearchParams(parseFilters(current), next)),
    [setSearchParams],
  );

  const clear = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  return { filters, page, setFilter, setPage, clear };
}

export function useEvents(filters: EventFilters, page: number) {
  const query = toApiQuery(filters, page);
  return useQuery({
    queryKey: eventKeys.list(query),
    queryFn: () => eventsApi.list(query),
    // Mantiene la página anterior visible mientras llega la nueva
    placeholderData: keepPreviousData,
    enabled: isDateRangeValid(filters),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? ''),
    queryFn: () => eventsApi.getById(id as string),
    enabled: isEventId(id),
  });
}
