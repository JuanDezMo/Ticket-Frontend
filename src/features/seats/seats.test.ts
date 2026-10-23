import { makeSeats } from '@/test/fixtures/events';
import { canSelectSeat, canSelectSeats } from './can-select-seat';
import { joinLabels, seatAllowance, totalPrice } from './seat-allowance';
import { groupSeatsByRow } from './seat-rows';
import { SEAT_STATUS_STYLE } from './seat-status-style';
import { useSeatSelectionStore } from './store';
import { SEAT_STATUSES } from './types';

describe('groupSeatsByRow', () => {
  it('groups 25 seats into rows of 10, 10 and 5', () => {
    const rows = groupSeatsByRow(makeSeats(25));
    expect(rows.map(({ row, seats }) => [row, seats.length])).toEqual([
      ['A', 10],
      ['B', 10],
      ['C', 5],
    ]);
  });
});

describe('SEAT_STATUS_STYLE', () => {
  it('has a label for every seat status', () => {
    expect(Object.keys(SEAT_STATUS_STYLE).sort()).toEqual(Object.values(SEAT_STATUSES).sort());
  });
});

describe('canSelectSeat', () => {
  const [available] = makeSeats(1);
  const [sold] = makeSeats(1, { A1: 'SOLD' });

  it('lets a USER select an available seat of a bookable event', () => {
    expect(canSelectSeat(available!, { role: 'USER', eventBookable: true })).toBe(true);
  });

  it.each([
    ['an ADMIN', available!, { role: 'ADMIN' as const, eventBookable: true }],
    ['a guest', available!, { role: null, eventBookable: true }],
    ['a seat that is not available', sold!, { role: 'USER' as const, eventBookable: true }],
    ['an event that is not bookable', available!, { role: 'USER' as const, eventBookable: false }],
  ])('rejects %s', (_case, seat, context) => {
    expect(canSelectSeat(seat, context)).toBe(false);
  });

  it('tells whether anyone can select seats at all', () => {
    expect(canSelectSeats({ role: 'USER', eventBookable: true })).toBe(true);
    expect(canSelectSeats({ role: 'ADMIN', eventBookable: true })).toBe(false);
  });
});

describe('seat selection store', () => {
  const store = () => useSeatSelectionStore.getState();
  afterEach(() => store().clear());

  it('selects and deselects the same seat', () => {
    store().toggle('event-1', 'C7', 4);
    expect(store()).toMatchObject({ eventId: 'event-1', seatLabels: ['C7'] });

    store().toggle('event-1', 'C7', 4);
    expect(store()).toMatchObject({ eventId: null, seatLabels: [] });
  });

  it('replaces the selection with another seat when only one fits', () => {
    store().toggle('event-1', 'C7', 1);
    store().toggle('event-1', 'D2', 1);
    expect(store().seatLabels).toEqual(['D2']);
  });

  it('adds seats up to the allowance and refuses the next one', () => {
    expect(store().toggle('event-1', 'C1', 3)).toBe(true);
    expect(store().toggle('event-1', 'C2', 3)).toBe(true);
    expect(store().toggle('event-1', 'C3', 3)).toBe(true);
    expect(store().toggle('event-1', 'C4', 3)).toBe(false);
    expect(store().seatLabels).toEqual(['C1', 'C2', 'C3']);
  });

  it('still lets the user remove a seat when the allowance is full', () => {
    store().toggle('event-1', 'C1', 2);
    store().toggle('event-1', 'C2', 2);
    expect(store().toggle('event-1', 'C1', 2)).toBe(true);
    expect(store().seatLabels).toEqual(['C2']);
  });

  it('selects nothing without allowance', () => {
    expect(store().toggle('event-1', 'C1', 0)).toBe(false);
    expect(store().seatLabels).toEqual([]);
  });

  it('keeps the selection of a single event', () => {
    store().toggle('event-1', 'C7', 4);
    store().toggle('event-2', 'A1', 4);
    expect(store()).toMatchObject({ eventId: 'event-2', seatLabels: ['A1'] });
  });

  it('removes only the seats that stopped being available and remembers them', () => {
    store().toggle('event-1', 'C7', 4);
    store().toggle('event-1', 'C8', 4);
    store().releaseUnavailable(['C7']);
    expect(store()).toMatchObject({
      eventId: 'event-1',
      seatLabels: ['C8'],
      lostSeatLabels: ['C7'],
    });
  });
});

describe('seatAllowance', () => {
  const hold = (eventId: string) => ({ eventId });

  it.each([
    [1, 0, 1],
    [1, 1, 0],
    [8, 0, 8],
    [8, 7, 1],
    [8, 8, 0],
    [4, 6, 0],
  ])('with a limit of %i and %i held, %i more can be chosen', (max, held, expected) => {
    const holds = Array.from({ length: held }, () => hold('event-1'));
    expect(seatAllowance(max, holds, 'event-1')).toBe(expected);
  });

  it('does not count what is held for another event', () => {
    expect(seatAllowance(2, [hold('event-2'), hold('event-2')], 'event-1')).toBe(2);
  });
});

describe('totalPrice', () => {
  it('multiplies in cents', () => {
    expect(totalPrice(49.99, 2)).toBe(99.98);
    expect(totalPrice(0.1, 3)).toBe(0.3);
    expect(totalPrice(49.99, 1)).toBe(49.99);
  });
});

describe('joinLabels', () => {
  it.each([
    [['A3'], 'A3'],
    [['A3', 'A4'], 'A3 and A4'],
    [['A3', 'A4', 'A5'], 'A3, A4 and A5'],
  ])('joins %j', (labels, expected) => {
    expect(joinLabels(labels)).toBe(expected);
  });
});
