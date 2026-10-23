import { http, HttpResponse } from 'msw';
import type { Event } from '@/features/events';
import { addEvent, findEvent, setEvents, setSeats } from './event-handlers';
import { apiPath, errorBody } from './handlers-shared';
import { cancelEventReservations } from './purchase-handlers';

const SEATS_PER_ROW = 10;
const FIRST_ROW_CODE = 'A'.charCodeAt(0);

interface CreateEventBody {
  name: string;
  description: string;
  type: Event['type'];
  venue: string;
  price: number;
  capacity: number;
  maxSeatsPerUser?: number;
  startDate: string;
  endDate: string;
}

interface CreateUserBody {
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
}

// Datos que la prueba carga para controlar las respuestas de administración
const registeredEmails = new Set<string>();
// Reservas y tickets que la API cancela junto con el evento
let cancellationCounts = { cancelledReservations: 0, cancelledTickets: 0 };

// Cuerpos recibidos, para comprobar qué envió la UI
export const createEventRequests: CreateEventBody[] = [];
export const cancelEventRequests: string[] = [];
export const createUserRequests: CreateUserBody[] = [];

export function setAdminData(data: {
  events?: Event[];
  emails?: string[];
  cancellation?: { cancelledReservations: number; cancelledTickets: number };
}) {
  if (data.events) setEvents(data.events);
  data.emails?.forEach((email) => registeredEmails.add(email));
  if (data.cancellation) cancellationCounts = data.cancellation;
}

export function resetAdminData() {
  registeredEmails.clear();
  cancellationCounts = { cancelledReservations: 0, cancelledTickets: 0 };
  createEventRequests.length = 0;
  cancelEventRequests.length = 0;
  createUserRequests.length = 0;
}

const validationError = () =>
  HttpResponse.json(errorBody('VALIDATION_ERROR', 'Invalid event'), { status: 400 });

function makeSeatsFor(capacity: number) {
  return Array.from({ length: capacity }, (_, index) => {
    const row = String.fromCharCode(FIRST_ROW_CODE + Math.floor(index / SEATS_PER_ROW));
    const number = (index % SEATS_PER_ROW) + 1;
    return {
      id: crypto.randomUUID(),
      row,
      number,
      label: `${row}${number}`,
      status: 'AVAILABLE' as const,
    };
  });
}

export const adminHandlers = [
  http.post(apiPath('/events'), async ({ request }) => {
    const body = (await request.json()) as CreateEventBody;
    createEventRequests.push(body);
    const limit = body.maxSeatsPerUser;
    if (
      !body.name ||
      body.price <= 0 ||
      body.capacity < 1 ||
      body.capacity > 260 ||
      limit === undefined ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 8 ||
      limit > body.capacity
    ) {
      return validationError();
    }
    const event: Event = {
      id: crypto.randomUUID(),
      ...body,
      maxSeatsPerUser: limit,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    // El listado y el detalle ven el evento nuevo, y la API genera sus seats
    addEvent(event);
    setSeats(event.id, makeSeatsFor(body.capacity));
    return HttpResponse.json(event, { status: 201 });
  }),

  http.post(apiPath('/events/:id/cancel'), ({ params }) => {
    const id = String(params.id);
    cancelEventRequests.push(id);
    const event = findEvent(id);
    if (!event) {
      return HttpResponse.json(errorBody('EVENT_NOT_FOUND', 'Event not found'), { status: 404 });
    }
    if (event.status === 'CANCELLED') {
      return HttpResponse.json(errorBody('EVENT_ALREADY_CANCELLED'), { status: 409 });
    }
    if (new Date(event.endDate).getTime() <= Date.now()) {
      return HttpResponse.json(errorBody('EVENT_ALREADY_ENDED'), { status: 409 });
    }
    event.status = 'CANCELLED';
    cancelEventReservations(id);
    return HttpResponse.json({ id, status: 'CANCELLED', ...cancellationCounts });
  }),

  http.post(apiPath('/users'), async ({ request }) => {
    const body = (await request.json()) as CreateUserBody;
    createUserRequests.push(body);
    if (registeredEmails.has(body.email)) {
      return HttpResponse.json(errorBody('EMAIL_ALREADY_EXISTS', 'Email already exists'), {
        status: 409,
      });
    }
    registeredEmails.add(body.email);
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        email: body.email,
        role: body.role,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
];
