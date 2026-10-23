import { makeReservation, minutesFromNow } from '@/test/fixtures/reservations';
import { groupCheckout } from './group';

describe('groupCheckout', () => {
  it('pays every ACTIVE reservation and adds up the total in cents', () => {
    const eventId = crypto.randomUUID();
    const a = makeReservation({ eventId, seat: 'C7', amount: 49.99 });
    const b = makeReservation({ eventId, seat: 'C8', amount: 49.99 });
    const c = makeReservation({ eventId, seat: 'C9', amount: 49.99 });

    const group = groupCheckout([a, b, c]);

    expect(group.payable.map((item) => item.seat)).toEqual(['C7', 'C8', 'C9']);
    expect(group.ended).toEqual([]);
    expect(group.total).toBe(149.97);
    expect(group.sameEvent).toBe(true);
  });

  it('does not drift with decimals that floating point cannot represent', () => {
    const eventId = crypto.randomUUID();
    const prices = [0.1, 0.2, 0.3].map((amount) => makeReservation({ eventId, amount }));
    expect(groupCheckout(prices).total).toBe(0.6);
  });

  it('leaves out what is no longer ACTIVE and does not charge for it', () => {
    const eventId = crypto.randomUUID();
    const active = makeReservation({ eventId, seat: 'C8', amount: 50 });
    const expired = makeReservation({ eventId, seat: 'C7', amount: 50, status: 'EXPIRED' });
    const paid = makeReservation({ eventId, seat: 'C9', amount: 50, status: 'CONFIRMED' });

    const group = groupCheckout([expired, active, paid]);

    expect(group.payable).toEqual([active]);
    expect(group.ended.map((item) => item.seat)).toEqual(['C7', 'C9']);
    expect(group.total).toBe(50);
  });

  it('picks the reservation that expires first', () => {
    const eventId = crypto.randomUUID();
    const later = makeReservation({ eventId, seat: 'C7', expiresAt: minutesFromNow(9) });
    const sooner = makeReservation({ eventId, seat: 'C8', expiresAt: minutesFromNow(3) });

    expect(groupCheckout([later, sooner]).soonest?.seat).toBe('C8');
  });

  it('has nothing to pay when every reservation ended', () => {
    const group = groupCheckout([makeReservation({ status: 'EXPIRED' })]);
    expect(group.payable).toEqual([]);
    expect(group.soonest).toBeUndefined();
    expect(group.total).toBe(0);
  });

  it('notices reservations of different events', () => {
    expect(groupCheckout([makeReservation(), makeReservation()]).sameEvent).toBe(false);
  });
});
