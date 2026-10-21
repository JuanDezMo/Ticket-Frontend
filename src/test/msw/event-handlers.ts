import { http, HttpResponse } from 'msw';
import type { Event } from '@/features/events/types';
import type { Seat } from '@/features/seats/types';
import { apiPath, errorBody } from './handlers-shared';

// "Base de datos" en memoria; cada prueba carga sus datos con setEvents/setSeats
let events: Event[] = [];
const seatsByEvent = new Map<string, Seat[]>();

// URLs recibidas, para comprobar qué consultó la UI
export const eventListRequests: URL[] = [];
export const seatRequests: URL[] = [];

export function setEvents(list: Event[]) {
  events = list;
}

export function setSeats(eventId: string, seats: Seat[]) {
  seatsByEvent.set(eventId, seats);
}

export function resetEventData() {
  events = [];
  seatsByEvent.clear();
  eventListRequests.length = 0;
  seatRequests.length = 0;
}

function matches(event: Event, params: URLSearchParams): boolean {
  const status = params.get('status');
  const type = params.get('type');
  const search = params.get('search');
  const startFrom = params.get('startFrom');
  const startTo = params.get('startTo');
  const start = new Date(event.startDate).getTime();
  return (
    (!status || event.status === status) &&
    (!type || event.type === type) &&
    (!search || event.name.toLowerCase().includes(search.toLowerCase())) &&
    (!startFrom || start >= new Date(startFrom).getTime()) &&
    (!startTo || start <= new Date(startTo).getTime())
  );
}

export const eventHandlers = [
  http.get(apiPath('/events'), ({ request }) => {
    const url = new URL(request.url);
    eventListRequests.push(url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const filtered = events.filter((event) => matches(event, url.searchParams));
    return HttpResponse.json({
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    });
  }),

  http.get(apiPath('/events/:id'), ({ params }) => {
    const event = events.find((candidate) => candidate.id === params.id);
    if (!event) {
      return HttpResponse.json(errorBody('EVENT_NOT_FOUND', 'Event not found'), { status: 404 });
    }
    return HttpResponse.json(event);
  }),

  http.get(apiPath('/events/:id/seats'), ({ request, params }) => {
    seatRequests.push(new URL(request.url));
    if (!request.headers.get('Authorization')) {
      return HttpResponse.json(errorBody('UNAUTHORIZED'), { status: 401 });
    }
    const eventId = String(params.id);
    const seats = seatsByEvent.get(eventId);
    if (!seats) {
      return HttpResponse.json(errorBody('EVENT_NOT_FOUND', 'Event not found'), { status: 404 });
    }
    return HttpResponse.json({ eventId, data: seats });
  }),
];
