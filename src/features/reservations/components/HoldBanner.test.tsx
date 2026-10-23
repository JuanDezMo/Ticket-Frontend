import { screen, waitFor } from '@testing-library/react';
import { ROUTES } from '@/shared/config/routes';
import { makeReservation, minutesFromNow } from '@/test/fixtures/reservations';
import { setReservations } from '@/test/msw/purchase-handlers';
import { renderRoute, signInAs } from '@/test/render';
import { useHoldStore } from '../hold.store';

function seedHold(overrides = {}) {
  const reservation = makeReservation(overrides);
  setReservations([reservation]);
  useHoldStore.getState().add([reservation]);
  return reservation;
}

describe('HoldBanner', () => {
  it('shows the held seat, the time left and a link to the checkout', async () => {
    signInAs('USER');
    const reservation = seedHold({ expiresAt: minutesFromNow(7.7) });
    renderRoute('/');

    const banner = await screen.findByRole('region', { name: 'Reservation in progress' });
    expect(banner).toHaveTextContent('Seat C7 is held');
    expect(banner).toHaveTextContent(/0[67]:\d\d/);
    expect(screen.getByRole('link', { name: 'Continue to checkout' })).toHaveAttribute(
      'href',
      ROUTES.checkout(reservation.id),
    );
  });

  it('counts the seats and shows the time of the one that expires first', async () => {
    signInAs('USER');
    const later = makeReservation({ seat: 'C9', expiresAt: minutesFromNow(9.5) });
    const sooner = makeReservation({ seat: 'C7', expiresAt: minutesFromNow(3.5) });
    const middle = makeReservation({ seat: 'C8', expiresAt: minutesFromNow(6.5) });
    setReservations([later, sooner, middle]);
    useHoldStore.getState().add([later, sooner, middle]);
    renderRoute('/');

    const banner = await screen.findByRole('region', { name: 'Reservation in progress' });
    await waitFor(() => expect(banner).toHaveTextContent('3 seats held'));
    expect(banner).toHaveTextContent(/0[23]:\d\d/);
    expect(screen.getByRole('link', { name: 'Continue to checkout' })).toHaveAttribute(
      'href',
      ROUTES.checkout(sooner.id),
    );
  });

  it('keeps showing the reservations that are still active when one ends', async () => {
    signInAs('USER');
    const active = makeReservation({ seat: 'C8' });
    const cancelled = makeReservation({ seat: 'C7', status: 'CANCELLED_BY_USER' });
    setReservations([active, cancelled]);
    useHoldStore.getState().add([cancelled, active]);
    renderRoute('/');

    const banner = await screen.findByRole('region', { name: 'Reservation in progress' });
    await waitFor(() => expect(banner).toHaveTextContent('Seat C8 is held'));
  });

  it('links to the checkout of the reservations of the same event', async () => {
    signInAs('USER');
    const eventId = crypto.randomUUID();
    const first = makeReservation({ eventId, seat: 'C7', expiresAt: minutesFromNow(3.5) });
    const second = makeReservation({ eventId, seat: 'C8', expiresAt: minutesFromNow(3.6) });
    setReservations([first, second]);
    useHoldStore.getState().add([second, first]);
    renderRoute('/');

    await screen.findByRole('region', { name: 'Reservation in progress' });
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Continue to checkout' })).toHaveAttribute(
        'href',
        ROUTES.checkoutFor([first.id, second.id]),
      ),
    );
  });

  it('links only to the event of the reservation that expires first', async () => {
    signInAs('USER');
    const sooner = makeReservation({ seat: 'C7', expiresAt: minutesFromNow(3.5) });
    const otherEvent = crypto.randomUUID();
    const later = [
      makeReservation({ eventId: otherEvent, seat: 'A1', expiresAt: minutesFromNow(8) }),
      makeReservation({ eventId: otherEvent, seat: 'A2', expiresAt: minutesFromNow(8) }),
    ];
    setReservations([sooner, ...later]);
    useHoldStore.getState().add([sooner, ...later]);
    renderRoute('/');

    await screen.findByRole('region', { name: 'Reservation in progress' });
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Continue to checkout' })).toHaveAttribute(
        'href',
        ROUTES.checkout(sooner.id),
      ),
    );
  });

  it('does not show on the checkout of a group that includes that reservation', async () => {
    signInAs('USER');
    const eventId = crypto.randomUUID();
    const a = makeReservation({ eventId, seat: 'C7' });
    const b = makeReservation({ eventId, seat: 'C8' });
    setReservations([a, b]);
    useHoldStore.getState().add([a, b]);
    renderRoute(ROUTES.checkoutFor([a.id, b.id]), [
      { path: ROUTES.checkoutGroup, element: <p>Checkout page</p> },
    ]);

    expect(await screen.findByText('Checkout page')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Reservation in progress' }),
    ).not.toBeInTheDocument();
  });

  it('does not show on the checkout of that reservation', async () => {
    signInAs('USER');
    const reservation = seedHold();
    renderRoute(ROUTES.checkout(reservation.id), [
      { path: ROUTES.checkoutPattern, element: <p>Checkout page</p> },
    ]);

    expect(await screen.findByText('Checkout page')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Reservation in progress' }),
    ).not.toBeInTheDocument();
  });

  it('does not show without a reservation or for an ADMIN', async () => {
    signInAs('ADMIN');
    seedHold();
    renderRoute('/');

    await screen.findByRole('heading', { name: 'Events' });
    expect(
      screen.queryByRole('region', { name: 'Reservation in progress' }),
    ).not.toBeInTheDocument();
  });

  it('disappears when the reservation expires', async () => {
    signInAs('USER');
    seedHold({ expiresAt: new Date(Date.now() + 1500).toISOString() });
    renderRoute('/');
    await screen.findByRole('region', { name: 'Reservation in progress' });

    await waitFor(
      () =>
        expect(
          screen.queryByRole('region', { name: 'Reservation in progress' }),
        ).not.toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(useHoldStore.getState().holds).toHaveLength(0);
  });
});
