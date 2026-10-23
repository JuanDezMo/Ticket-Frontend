import { screen, waitFor } from '@testing-library/react';
import { ROUTES } from '@/shared/config/routes';
import { makeReservation, minutesFromNow } from '@/test/fixtures/reservations';
import { setReservations } from '@/test/msw/purchase-handlers';
import { renderRoute, signInAs } from '@/test/render';
import { useHoldStore } from '../hold.store';

function seedHold(overrides = {}) {
  const reservation = makeReservation(overrides);
  setReservations([reservation]);
  useHoldStore.getState().start(reservation);
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
    expect(useHoldStore.getState().hold).toBeNull();
  });
});
