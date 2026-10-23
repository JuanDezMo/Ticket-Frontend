import { makeReservation } from '@/test/fixtures/reservations';
import { useHoldStore } from './hold.store';

const holds = () => useHoldStore.getState().holds;

describe('useHoldStore', () => {
  it('keeps only the defined fields of the reservation', () => {
    const reservation = makeReservation({ seat: 'C7', amount: 49.99 });
    useHoldStore.getState().add([reservation]);

    expect(holds()).toEqual([
      {
        reservationId: reservation.id,
        eventId: reservation.eventId,
        seatLabel: 'C7',
        amount: 49.99,
        createdAt: reservation.createdAt,
        expiresAt: reservation.expiresAt,
      },
    ]);
  });

  it('adds a batch without repeating a reservation it already has', () => {
    const first = makeReservation({ seat: 'C7' });
    const second = makeReservation({ seat: 'C8' });
    useHoldStore.getState().add([first, second]);
    useHoldStore.getState().add([second]);

    expect(holds().map((hold) => hold.seatLabel)).toEqual(['C7', 'C8']);
  });

  it('removes only one reservation', () => {
    const first = makeReservation({ seat: 'C7' });
    const second = makeReservation({ seat: 'C8' });
    useHoldStore.getState().add([first, second]);
    useHoldStore.getState().remove(first.id);

    expect(holds().map((hold) => hold.seatLabel)).toEqual(['C8']);
  });

  it('survives a rehydration from sessionStorage', async () => {
    const reservation = makeReservation();
    useHoldStore.getState().add([reservation]);
    const saved = sessionStorage.getItem('ticket-hold');
    expect(saved).not.toBeNull();

    useHoldStore.setState({ holds: [] });
    sessionStorage.setItem('ticket-hold', saved as string);
    await useHoldStore.persist.rehydrate();

    expect(holds()[0]?.reservationId).toBe(reservation.id);
  });

  it('stores nothing but the list of holds', () => {
    useHoldStore.getState().add([makeReservation()]);
    const stored = JSON.parse(sessionStorage.getItem('ticket-hold') as string);
    expect(Object.keys(stored.state)).toEqual(['holds']);
    expect(stored.version).toBe(2);
  });

  it('clears every hold', () => {
    useHoldStore.getState().add([makeReservation(), makeReservation()]);
    useHoldStore.getState().clear();
    expect(holds()).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem('ticket-hold') as string).state.holds).toEqual([]);
  });

  describe('value stored with the previous shape', () => {
    const rehydrateWith = async (stored: unknown) => {
      useHoldStore.setState({ holds: [] });
      sessionStorage.setItem('ticket-hold', JSON.stringify(stored));
      await useHoldStore.persist.rehydrate();
    };

    it('turns a single hold into a list of one', async () => {
      const hold = {
        reservationId: crypto.randomUUID(),
        eventId: crypto.randomUUID(),
        seatLabel: 'C7',
        amount: 49.99,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      };
      await rehydrateWith({ state: { hold }, version: 0 });

      expect(holds()).toEqual([hold]);
    });

    it('turns an empty hold into an empty list', async () => {
      await rehydrateWith({ state: { hold: null }, version: 0 });
      expect(holds()).toEqual([]);
    });

    it('does not fail with unreadable content', async () => {
      await rehydrateWith({ state: null, version: 0 });
      expect(holds()).toEqual([]);
    });
  });
});
