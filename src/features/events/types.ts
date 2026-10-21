export const EVENT_STATUSES = { ACTIVE: 'ACTIVE', CANCELLED: 'CANCELLED' } as const;
export type EventStatus = (typeof EVENT_STATUSES)[keyof typeof EVENT_STATUSES];
export const EVENT_STATUS_VALUES = Object.values(EVENT_STATUSES) as [EventStatus, ...EventStatus[]];

export const EVENT_TYPES = {
  CONCERT: 'CONCERT',
  MEETUP: 'MEETUP',
  MEETING: 'MEETING',
  OTHER: 'OTHER',
} as const;
export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
export const EVENT_TYPE_VALUES = Object.values(EVENT_TYPES) as [EventType, ...EventType[]];

// Formato de GET /events y GET /events/:id
export interface Event {
  id: string;
  name: string;
  description: string;
  type: EventType;
  venue: string;
  price: number;
  capacity: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: EventStatus;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EventPage {
  data: Event[];
  meta: PageMeta;
}

/** Filtros tal como viven en la URL; las fechas son de calendario (YYYY-MM-DD). */
export interface EventFilters {
  status?: EventStatus;
  type?: EventType;
  from?: string;
  to?: string;
  search?: string;
}

export interface EventListQuery {
  page: number;
  pageSize: number;
  status?: EventStatus;
  type?: EventType;
  startFrom?: string;
  startTo?: string;
  search?: string;
}
