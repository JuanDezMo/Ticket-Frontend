import { http, HttpResponse } from 'msw';
import type { Reservation } from '@/features/reservations/types';
import type { IssuedTicket, MyTicket } from '@/features/tickets/types';
import { findEvent, findSeats } from './event-handlers';
import { apiPath, errorBody } from './handlers-shared';

// Terminaciones de tarjeta con las que la pasarela simulada responde distinto
const REJECTED_ENDING = '0000';
const GATEWAY_ERROR_ENDING = '9999';
// Al tercer error con la misma tarjeta y reserva, la pasarela responde 422
const GATEWAY_ERRORS_BEFORE_CARD_PROBLEM = 2;

let reservations: Reservation[] = [];
let tickets: MyTicket[] = [];
const issuedByReservation = new Map<string, IssuedTicket>();
const gatewayErrors = new Map<string, number>();

// Cuerpos recibidos, para comprobar cuántas solicitudes envió la UI
export const reserveRequests: { eventId: string; seat: string }[] = [];
export const purchaseRequests: unknown[] = [];

export function setReservations(list: Reservation[]) {
  reservations = list;
}

export function getReservation(id: string): Reservation | undefined {
  return reservations.find((candidate) => candidate.id === id);
}

export function setTickets(list: MyTicket[]) {
  tickets = list;
}

/** Lo que hace ticket-api al cancelar un evento: sus reservas activas se cancelan y los seats se liberan. */
export function cancelEventReservations(eventId: string) {
  for (const reservation of reservations) {
    if (reservation.eventId === eventId && reservation.status === 'ACTIVE') {
      setStatus(reservation, 'CANCELLED');
      setSeatStatus(reservation, 'AVAILABLE');
    }
  }
}

export function resetPurchaseData() {
  reservations = [];
  tickets = [];
  issuedByReservation.clear();
  gatewayErrors.clear();
  reserveRequests.length = 0;
  purchaseRequests.length = 0;
}

// Igual que la API: una reserva activa vencida se informa como EXPIRED
function effective(reservation: Reservation): Reservation {
  const expired =
    reservation.status === 'ACTIVE' && new Date(reservation.expiresAt).getTime() <= Date.now();
  return expired ? { ...reservation, status: 'EXPIRED' } : reservation;
}

function setStatus(reservation: Reservation, status: Reservation['status']) {
  reservation.status = status;
}

function setSeatStatus(reservation: Reservation, status: 'AVAILABLE' | 'RESERVED' | 'SOLD') {
  const seat = findSeats(reservation.eventId)?.find(
    (candidate) => candidate.label === reservation.seat,
  );
  if (seat) seat.status = status;
}

const notFound = () =>
  HttpResponse.json(errorBody('RESERVATION_NOT_FOUND', 'Reservation not found'), { status: 404 });
const conflict = (code: string) => HttpResponse.json(errorBody(code), { status: 409 });

// Código del conflicto que corresponde a una reserva que no está activa
const INACTIVE_CODE = {
  EXPIRED: 'RESERVATION_EXPIRED',
  CANCELLED: 'EVENT_CANCELLED',
  CANCELLED_BY_USER: 'RESERVATION_ALREADY_CANCELLED',
  CONFIRMED: 'RESERVATION_ALREADY_CONFIRMED',
} as const;

export const purchaseHandlers = [
  http.post(apiPath('/reservations'), async ({ request }) => {
    const body = (await request.json()) as { eventId: string; seat: string };
    reserveRequests.push(body);
    const event = findEvent(body.eventId);
    if (!event) {
      return HttpResponse.json(errorBody('EVENT_NOT_FOUND', 'Event not found'), { status: 404 });
    }
    if (event.status !== 'ACTIVE') return conflict('EVENT_NOT_ACTIVE');
    const seat = findSeats(body.eventId)?.find((candidate) => candidate.label === body.seat);
    if (!seat) {
      return HttpResponse.json(errorBody('SEAT_NOT_FOUND', 'Seat not found'), { status: 404 });
    }
    if (seat.status !== 'AVAILABLE') return conflict('SEAT_NOT_AVAILABLE');
    seat.status = 'RESERVED';
    const now = Date.now();
    const reservation: Reservation = {
      id: crypto.randomUUID(),
      eventId: body.eventId,
      seatId: seat.id,
      seat: seat.label,
      status: 'ACTIVE',
      amount: event.price,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
    };
    reservations.push(reservation);
    return HttpResponse.json(reservation, { status: 201 });
  }),

  http.get(apiPath('/reservations/:id'), ({ params }) => {
    const reservation = getReservation(String(params.id));
    return reservation ? HttpResponse.json(effective(reservation)) : notFound();
  }),

  http.post(apiPath('/reservations/:id/cancel'), ({ params }) => {
    const reservation = getReservation(String(params.id));
    if (!reservation) return notFound();
    const current = effective(reservation);
    if (current.status !== 'ACTIVE') return conflict(INACTIVE_CODE[current.status]);
    setStatus(reservation, 'CANCELLED_BY_USER');
    setSeatStatus(reservation, 'AVAILABLE');
    return HttpResponse.json(reservation);
  }),

  http.post(apiPath('/tickets/purchase'), async ({ request }) => {
    const body = (await request.json()) as {
      reservationId: string;
      card: { number: string };
    };
    purchaseRequests.push(body);
    const reservation = getReservation(body.reservationId);
    if (!reservation) return notFound();

    const already = issuedByReservation.get(reservation.id);
    if (already) return HttpResponse.json(already, { status: 200 });

    const current = effective(reservation);
    if (current.status !== 'ACTIVE') return conflict(INACTIVE_CODE[current.status]);

    const number = body.card.number;
    if (number.endsWith(REJECTED_ENDING)) {
      return HttpResponse.json(errorBody('PAYMENT_REJECTED'), { status: 402 });
    }
    if (number.endsWith(GATEWAY_ERROR_ENDING)) {
      const key = `${reservation.id}:${number}`;
      const failures = gatewayErrors.get(key) ?? 0;
      gatewayErrors.set(key, failures + 1);
      return failures >= GATEWAY_ERRORS_BEFORE_CARD_PROBLEM
        ? HttpResponse.json(errorBody('CARD_PROBLEM'), { status: 422 })
        : HttpResponse.json(errorBody('PAYMENT_GATEWAY_ERROR'), { status: 502 });
    }

    const issuedAt = new Date().toISOString();
    const issued: IssuedTicket = {
      id: crypto.randomUUID(),
      reservationId: reservation.id,
      eventId: reservation.eventId,
      seat: reservation.seat,
      status: 'ISSUED',
      amount: reservation.amount,
      transactionId: `txn_${reservation.id.slice(0, 8)}`,
      issuedAt,
    };
    issuedByReservation.set(reservation.id, issued);
    setStatus(reservation, 'CONFIRMED');
    setSeatStatus(reservation, 'SOLD');
    const event = findEvent(reservation.eventId);
    tickets.unshift({
      id: issued.id,
      status: 'ISSUED',
      seat: issued.seat,
      amount: issued.amount,
      issuedAt,
      event: {
        id: reservation.eventId,
        name: event?.name ?? 'Event',
        venue: event?.venue ?? 'Venue',
        startDate: event?.startDate ?? issuedAt,
      },
    });
    return HttpResponse.json(issued, { status: 201 });
  }),

  http.get(apiPath('/tickets/me'), ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    return HttpResponse.json({
      data: tickets.slice((page - 1) * pageSize, page * pageSize),
      meta: {
        page,
        pageSize,
        total: tickets.length,
        totalPages: Math.ceil(tickets.length / pageSize),
      },
    });
  }),
];
