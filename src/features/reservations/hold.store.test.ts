import { makeReservation } from '@/test/fixtures/reservations';
import { useHoldStore } from './hold.store';

describe('useHoldStore', () => {
  it('keeps only the defined fields of the reservation', () => {
    const reservation = makeReservation({ seat: 'C7', amount: 49.99 });
    useHoldStore.getState().start(reservation);

    expect(useHoldStore.getState().hold).toEqual({
      reservationId: reservation.id,
      eventId: reservation.eventId,
      seatLabel: 'C7',
      amount: 49.99,
      createdAt: reservation.createdAt,
      expiresAt: reservation.expiresAt,
    });
  });

  it('survives a rehydration from sessionStorage', async () => {
    const reservation = makeReservation();
    useHoldStore.getState().start(reservation);
    const saved = sessionStorage.getItem('ticket-hold');
    expect(saved).not.toBeNull();

    useHoldStore.setState({ hold: null });
    sessionStorage.setItem('ticket-hold', saved as string);
    await useHoldStore.persist.rehydrate();

    expect(useHoldStore.getState().hold?.reservationId).toBe(reservation.id);
  });

  it('stores nothing but the hold', () => {
    useHoldStore.getState().start(makeReservation());
    const stored = JSON.parse(sessionStorage.getItem('ticket-hold') as string);
    expect(Object.keys(stored.state)).toEqual(['hold']);
  });

  it('clears the hold', () => {
    useHoldStore.getState().start(makeReservation());
    useHoldStore.getState().clear();
    expect(useHoldStore.getState().hold).toBeNull();
    expect(JSON.parse(sessionStorage.getItem('ticket-hold') as string).state.hold).toBeNull();
  });
});
