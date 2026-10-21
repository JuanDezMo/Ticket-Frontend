import { makeSeats } from '@/test/fixtures/events';
import { canSelectSeat, canSelectSeats } from './can-select-seat';
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
    store().toggle('event-1', 'C7');
    expect(store()).toMatchObject({ eventId: 'event-1', seatLabel: 'C7' });

    store().toggle('event-1', 'C7');
    expect(store()).toMatchObject({ eventId: null, seatLabel: null });
  });

  it('replaces the selection with another seat', () => {
    store().toggle('event-1', 'C7');
    store().toggle('event-1', 'D2');
    expect(store().seatLabel).toBe('D2');
  });

  it('keeps a single selection across events', () => {
    store().toggle('event-1', 'C7');
    store().toggle('event-2', 'A1');
    expect(store()).toMatchObject({ eventId: 'event-2', seatLabel: 'A1' });
  });

  it('remembers the seat that stopped being available', () => {
    store().toggle('event-1', 'C7');
    store().releaseUnavailable();
    expect(store()).toMatchObject({ eventId: 'event-1', seatLabel: null, lostSeatLabel: 'C7' });
  });
});
