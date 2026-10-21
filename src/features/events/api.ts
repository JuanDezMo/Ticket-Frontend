import { http } from '@/shared/api/http-client';
import type { Event, EventListQuery, EventPage } from './types';

export const eventsApi = {
  list: (query: EventListQuery) => http.get<EventPage>('/events', { query: { ...query } }),
  getById: (id: string) => http.get<Event>(`/events/${id}`),
};
