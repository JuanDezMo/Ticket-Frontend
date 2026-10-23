import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { makeReservation } from '@/test/fixtures/reservations';
import { setEvents, setSeats } from './event-handlers';
import { apiPath } from './handlers-shared';
import { setReservations } from './purchase-handlers';

const card = { brand: 'VISA', number: '4111111111111111', expiry: '12/99', cvv: '123' };
const purchase = (body: unknown) =>
  fetch(`http://localhost${apiPath('/tickets/purchase').replace('*', '')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

function seedGroup(count: number) {
  const event = makeEvent({ price: 49.99, capacity: 30 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30));
  const group = Array.from({ length: count }, (_, index) =>
    makeReservation({ eventId: event.id, seat: `C${index + 1}`, amount: 49.99 }),
  );
  setReservations(group);
  return { event, group };
}

describe('purchase handler', () => {
  it('issues one ticket per reservation in one order and answers 201', async () => {
    const { group } = seedGroup(3);

    const response = await purchase({ reservationIds: group.map((item) => item.id), card });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.amount).toBe(149.97);
    expect(body.tickets.map((ticket: { seat: string }) => ticket.seat)).toEqual(['C1', 'C2', 'C3']);
    expect(body.orderId).toEqual(expect.any(String));
  });

  it('rejects the old reservationId field and lists that are empty or too long', async () => {
    const { group } = seedGroup(1);

    expect((await purchase({ reservationId: group[0]!.id, card })).status).toBe(400);
    expect((await purchase({ reservationIds: [], card })).status).toBe(400);
    expect((await purchase({ reservationIds: Array(9).fill(group[0]!.id), card })).status).toBe(
      400,
    );
  });

  it('answers 409 DUPLICATE_PAYMENT when a reservation was already paid', async () => {
    const { group } = seedGroup(2);
    await purchase({ reservationIds: [group[0]!.id], card });

    const response = await purchase({ reservationIds: group.map((item) => item.id), card });

    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('DUPLICATE_PAYMENT');
  });

  it('answers 400 RESERVATIONS_MISMATCH for reservations of different events', async () => {
    const { group } = seedGroup(1);
    const other = makeReservation({ seat: 'A1' });
    setReservations([...group, other]);

    const response = await purchase({ reservationIds: [group[0]!.id, other.id], card });

    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('RESERVATIONS_MISMATCH');
  });

  it('answers with the first problem of the list, in order', async () => {
    const { event } = seedGroup(0);
    const expired = makeReservation({ eventId: event.id, status: 'EXPIRED' });
    const active = makeReservation({ eventId: event.id });
    setReservations([expired, active]);

    const response = await purchase({ reservationIds: [active.id, expired.id], card });

    expect((await response.json()).code).toBe('RESERVATION_EXPIRED');
  });
});
