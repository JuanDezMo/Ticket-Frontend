import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useHoldStore } from '@/features/reservations/hold.store';
import { seatKeys } from '@/features/seats';
import { useSessionStore } from '@/shared/session/session.store';
import { REDIRECT_PARAM, ROUTES } from '@/shared/config/routes';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { makeReservation, minutesFromNow } from '@/test/fixtures/reservations';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { purchaseRequests, setReservations } from '@/test/msw/purchase-handlers';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

function seed(reservationOverrides = {}) {
  const event = makeEvent({ name: 'Rock Night', price: 49.99, capacity: 30 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30, { C7: 'RESERVED' }));
  const reservation = makeReservation({ eventId: event.id, ...reservationOverrides });
  setReservations([reservation]);
  return { event, reservation };
}

async function pay(user: ReturnType<typeof renderRoute>['user'], number = '4111111111111111') {
  await user.selectOptions(await screen.findByLabelText('Card brand'), 'VISA');
  await user.type(screen.getByLabelText('Card number'), number);
  await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
  await user.type(screen.getByLabelText('CVV'), '123');
  await user.click(screen.getByRole('button', { name: /^Pay / }));
}

describe('CheckoutPage reservation states', () => {
  beforeEach(() => signInAs('USER'));

  it('shows the seat, event, amount, countdown and the card form for an ACTIVE reservation', async () => {
    const { reservation } = seed({ expiresAt: minutesFromNow(7.7) });
    renderRoute(ROUTES.checkout(reservation.id));

    expect(await screen.findByText('C7')).toBeInTheDocument();
    expect(await screen.findByText('Rock Night')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay $49.99' })).toBeInTheDocument();
    expect(screen.getByText(/0[67]:\d\d/)).toBeInTheDocument();
    expect(screen.getByLabelText('Card number')).toBeInTheDocument();
  });

  it('shows the expired state with a link back to the event', async () => {
    const { event, reservation } = seed({ expiresAt: minutesFromNow(-1) });
    renderRoute(ROUTES.checkout(reservation.id));

    expect(await screen.findByText('This reservation has expired')).toBeInTheDocument();
    expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to event' })).toHaveAttribute(
      'href',
      ROUTES.eventDetail(event.id),
    );
  });

  it.each(['CANCELLED', 'CANCELLED_BY_USER'] as const)(
    'shows the cancelled state for %s',
    async (status) => {
      const { reservation } = seed({ status });
      renderRoute(ROUTES.checkout(reservation.id));

      expect(await screen.findByText('This reservation was cancelled')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to event' })).toBeInTheDocument();
    },
  );

  it('shows the paid state with a link to My tickets', async () => {
    const { reservation } = seed({ status: 'CONFIRMED' });
    renderRoute(ROUTES.checkout(reservation.id));

    expect(await screen.findByText('This reservation is already paid')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my tickets' })).toHaveAttribute(
      'href',
      ROUTES.myTickets,
    );
  });

  it('shows "Reservation not found" for an unknown reservation', async () => {
    seed();
    renderRoute(ROUTES.checkout(crypto.randomUUID()));

    expect(await screen.findByText('Reservation not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to events' })).toHaveAttribute('href', '/');
  });

  it('shows "Reservation not found" for somebody else’s reservation (403)', async () => {
    const { reservation } = seed();
    server.use(
      http.get(apiPath('/reservations/:id'), () =>
        HttpResponse.json(errorBody('FORBIDDEN'), { status: 403 }),
      ),
    );
    renderRoute(ROUTES.checkout(reservation.id));

    expect(await screen.findByText('Reservation not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to events' })).toBeInTheDocument();
  });

  it('does not call the API for an id that is not a UUID', async () => {
    const calls = vi.fn();
    server.use(
      http.get(apiPath('/reservations/:id'), () => {
        calls();
        return HttpResponse.json(errorBody('NOT_FOUND'), { status: 404 });
      }),
    );
    renderRoute(ROUTES.checkout('not-a-uuid'));

    expect(await screen.findByText('Reservation not found')).toBeInTheDocument();
    expect(calls).not.toHaveBeenCalled();
  });

  it('sends a visitor to the login and back to the checkout', async () => {
    useSessionStore.getState().signOut();
    const { reservation } = seed();
    const { router } = renderRoute(ROUTES.checkout(reservation.id));
    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.login));
    const redirect = new URLSearchParams(router.state.location.search).get(REDIRECT_PARAM);
    expect(redirect).toBe(ROUTES.checkout(reservation.id));
  });

  it('replaces the form by the expired state when the countdown reaches zero', async () => {
    const { reservation } = seed({ expiresAt: new Date(Date.now() + 1500).toISOString() });
    renderRoute(ROUTES.checkout(reservation.id));
    await screen.findByLabelText('Card number');

    expect(
      await screen.findByText('This reservation has expired', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument();
  });
});

describe('CheckoutPage payment', () => {
  beforeEach(() => signInAs('USER'));

  it('issues the ticket, drops the hold and refreshes the seat map', async () => {
    const { event, reservation } = seed();
    useHoldStore.getState().add([reservation]);
    const { user, queryClient } = renderRoute(ROUTES.checkout(reservation.id));
    queryClient.setQueryData(seatKeys.byEvent(event.id), { eventId: event.id, data: [] });

    await pay(user);

    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();
    expect(screen.getByText('C7')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(await screen.findByText('Rock Night')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my tickets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to events' })).toBeInTheDocument();
    expect(useHoldStore.getState().holds).toHaveLength(0);
    expect(queryClient.getQueryState(seatKeys.byEvent(event.id))?.isInvalidated).toBe(true);
    expect(purchaseRequests).toHaveLength(1);
  });

  it('shows the same confirmation when the purchase was already made (200)', async () => {
    const { reservation, event } = seed();
    server.use(
      http.post(apiPath('/tickets/purchase'), () =>
        HttpResponse.json(
          {
            id: 't1',
            reservationId: reservation.id,
            eventId: event.id,
            seat: 'C7',
            status: 'ISSUED',
            amount: 49.99,
            transactionId: 'txn_1',
            issuedAt: new Date().toISOString(),
          },
          { status: 200 },
        ),
      ),
    );
    const { user } = renderRoute(ROUTES.checkout(reservation.id));

    await pay(user);

    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();
  });

  it.each([
    ['RESERVATION_EXPIRED', 409, 'This reservation has expired'],
    ['EVENT_CANCELLED', 409, 'This event has been cancelled'],
    ['RESERVATION_ALREADY_CANCELLED', 409, 'This reservation was cancelled'],
    ['RESERVATION_NOT_FOUND', 404, 'Reservation not found'],
    ['FORBIDDEN', 403, 'Reservation not found'],
  ])('replaces the form after %s and drops the hold', async (code, status, message) => {
    const { reservation } = seed();
    useHoldStore.getState().add([reservation]);
    server.use(
      http.post(apiPath('/tickets/purchase'), () => HttpResponse.json(errorBody(code), { status })),
    );
    const { user } = renderRoute(ROUTES.checkout(reservation.id));

    await pay(user);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument();
    expect(useHoldStore.getState().holds).toHaveLength(0);
  });

  it('keeps the form after a rejected payment and lets the user try another card', async () => {
    const { reservation } = seed();
    const { user } = renderRoute(ROUTES.checkout(reservation.id));

    await pay(user, '4111111111110000');

    expect(
      await screen.findByText('Payment was rejected. Please try another card'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Card number')).toHaveValue('');
    await user.type(screen.getByLabelText('Card number'), '4111111111111111');
    await user.type(screen.getByLabelText('CVV'), '123');
    await user.click(screen.getByRole('button', { name: /^Pay / }));

    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();
  });
});
