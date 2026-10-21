import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { eventsApi } from './api';
import { isDateRangeValid, parseFilters, parsePage, toApiQuery, toSearchParams } from './filters';
import { eventKeys } from './query-keys';
import { isEventId } from './schemas';
import { useEventListStore } from './store';
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

/** Guarda los filtros del listado actual para que "Back to events" vuelva a ellos. */
export function useRememberListSearch(): void {
  const { search } = useLocation();
  const setLastSearch = useEventListStore((state) => state.setLastSearch);
  useEffect(() => setLastSearch(search), [search, setLastSearch]);
}

/** Ruta del listado con los últimos filtros usados en esta pestaña. */
export function useBackToEventsPath(): string {
  const lastSearch = useEventListStore((state) => state.lastSearch);
  return `${ROUTES.home}${lastSearch}`;
}
