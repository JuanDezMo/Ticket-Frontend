import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { z } from 'zod';
import { EVENTS_PAGE_SIZE } from './constants';
import {
  EVENT_STATUS_VALUES,
  EVENT_TYPE_VALUES,
  type EventFilters,
  type EventListQuery,
} from './types';

export const PAGE_PARAM = 'page';
const FIRST_PAGE = 1;
const MAX_SEARCH_LENGTH = 100;

// Un schema por parámetro: un valor inválido se descarta sin afectar a los demás
const statusSchema = z.enum(EVENT_STATUS_VALUES);
const typeSchema = z.enum(EVENT_TYPE_VALUES);
const dateSchema = z.iso.date();
const searchSchema = z.string().trim().min(1).max(MAX_SEARCH_LENGTH);

function read<T>(schema: z.ZodType<T>, params: URLSearchParams, key: string): T | undefined {
  const result = schema.safeParse(params.get(key) ?? undefined);
  return result.success ? result.data : undefined;
}

export function parseFilters(params: URLSearchParams): EventFilters {
  return {
    status: read(statusSchema, params, 'status'),
    type: read(typeSchema, params, 'type'),
    from: read(dateSchema, params, 'from'),
    to: read(dateSchema, params, 'to'),
    search: read(searchSchema, params, 'search'),
  };
}

export function parsePage(params: URLSearchParams): number {
  const page = Number(params.get(PAGE_PARAM));
  return Number.isInteger(page) && page >= FIRST_PAGE ? page : FIRST_PAGE;
}

/** Arma la URL: omite los filtros vacíos y la página 1. */
export function toSearchParams(filters: EventFilters, page: number): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (page > FIRST_PAGE) params.set(PAGE_PARAM, String(page));
  return params;
}

export function hasFilters(filters: EventFilters): boolean {
  return Object.values(filters).some(Boolean);
}

// Las fechas son YYYY-MM-DD, así que compararlas como texto respeta el orden
export function isDateRangeValid({ from, to }: EventFilters): boolean {
  return !from || !to || from <= to;
}

/** Convierte los filtros de la URL a la consulta de la API (fechas en hora local). */
export function toApiQuery(filters: EventFilters, page: number): EventListQuery {
  return {
    page,
    pageSize: EVENTS_PAGE_SIZE,
    status: filters.status,
    type: filters.type,
    search: filters.search,
    startFrom: filters.from ? startOfDay(parseISO(filters.from)).toISOString() : undefined,
    startTo: filters.to ? endOfDay(parseISO(filters.to)).toISOString() : undefined,
  };
}
