import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useHoldStore } from '@/features/reservations/hold.store';
import type { Reservation } from '@/features/reservations/types';
import { REDIRECT_PARAM, ROUTES } from '@/shared/config/routes';
import { useSessionStore } from '@/shared/session/session.store';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { makeReservation, minutesFromNow } from '@/test/fixtures/reservations';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { purchaseRequests, setReservations } from '@/test/msw/purchase-handlers';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

type User = ReturnType<typeof renderRoute>['user'];

/** Un evento y una reserva por cada seat pedido, de $49.99 cada una. */
function seedGroup(labels: string[], overrides: Record<string, Partial<Reservation>> = {}) {
  const event = makeEvent({ name: 'Rock Night', price: 49.99, capacity: 30, maxSeatsPerUser: 8 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30));
  const group = labels.map((seat) =>
    makeReservation({ eventId: event.id, seat, amount: 49.99, ...overrides[seat] }),
  );
  setReservations(group);
  return { event, group, path: ROUTES.checkoutFor(group.map((item) => item.id)) };
}

async function pay(user: User, number = '4111111111111111') {
  await user.selectOptions(await screen.findByLabelText('Card brand'), 'VISA');
  await user.type(screen.getByLabelText('Card number'), number);
  await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
  await user.type(screen.getByLabelText('CVV'), '123');
  await user.click(screen.getByRole('button', { name: /^Pay / }));
}

const failPurchaseWith = (code: string, status: number) =>
  server.use(
    http.post(apiPath('/tickets/purchase'), () => HttpResponse.json(errorBody(code), { status })),
  );

describe('group checkout: what is shown', () => {
  beforeEach(() => signInAs('USER'));

  it('lists the seats, the total and one card form', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    renderRoute(path);

    expect(await screen.findByText('C7')).toBeInTheDocument();
    expect(screen.getByText('C8')).toBeInTheDocument();
    expect(await screen.findByText('Rock Night')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay $99.98' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Card number')).toHaveLength(1);
  });

  it('counts down to the reservation that expires first', async () => {
    const { path } = seedGroup(['C7', 'C8'], {
      C7: { expiresAt: minutesFromNow(9.5) },
      C8: { expiresAt: minutesFromNow(3.5) },
    });
    renderRoute(path);

    expect(await screen.findByText(/0[23]:\d\d/)).toBeInTheDocument();
  });

  it('opens a group of 8 reservations', async () => {
    const labels = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    const { path } = seedGroup(labels);
    renderRoute(path);

    expect(await screen.findByRole('button', { name: 'Pay $399.92' })).toBeInTheDocument();
  });

  it('shows what is no longer valid, drops it, and charges only the rest', async () => {
    const { group, path } = seedGroup(['C7', 'C8'], { C7: { status: 'EXPIRED' } });
    useHoldStore.getState().add(group);
    renderRoute(path);

    expect(await screen.findByText(/C7 can no longer be paid/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to event' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay $49.99' })).toBeInTheDocument();
    await waitFor(() =>
      expect(useHoldStore.getState().holds.map((hold) => hold.seatLabel)).toEqual(['C8']),
    );
  });

  it('says every reservation is already paid', async () => {
    const { path } = seedGroup(['C7', 'C8'], {
      C7: { status: 'CONFIRMED' },
      C8: { status: 'CONFIRMED' },
    });
    renderRoute(path);

    expect(await screen.findByText('These reservations are already paid')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my tickets' })).toBeInTheDocument();
  });

  it('shows the expired state when none can be paid', async () => {
    const { path } = seedGroup(['C7', 'C8'], {
      C7: { status: 'EXPIRED' },
      C8: { status: 'EXPIRED' },
    });
    renderRoute(path);

    expect(await screen.findByText('This reservation has expired')).toBeInTheDocument();
    expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument();
  });

  it('does not accept a link of reservations from different events', async () => {
    seedGroup(['C7']);
    const other = makeReservation({ seat: 'A1' });
    const first = makeReservation({ seat: 'C1' });
    setReservations([first, other]);
    renderRoute(ROUTES.checkoutFor([first.id, other.id]));

    expect(await screen.findByText('Reservation not found')).toBeInTheDocument();
  });

  it('shows "Reservation not found" when one of the reservations is not the user’s', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    server.use(
      http.get(apiPath('/reservations/:id'), () =>
        HttpResponse.json(errorBody('FORBIDDEN'), { status: 403 }),
      ),
    );
    renderRoute(path);

    expect(await screen.findByText('Reservation not found')).toBeInTheDocument();
  });

  const uuid = () => crypto.randomUUID();
  it.each([
    ['an id that is not a UUID', () => `/checkout?ids=${uuid()},abc`],
    [
      'a repeated id',
      () => {
        const id = uuid();
        return `/checkout?ids=${id},${id}`;
      },
    ],
    ['9 ids', () => `/checkout?ids=${Array.from({ length: 9 }, uuid).join(',')}`],
    ['no ids', () => '/checkout'],
    ['an empty list', () => '/checkout?ids='],
  ])('shows "Reservation not found" without calling the API for %s', async (_label, path) => {
    const onRequest = vi.fn();
    server.events.on('request:start', onRequest);
    renderRoute(path());

    expect(await screen.findByText('Reservation not found')).toBeInTheDocument();
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('sends a visitor to the login and back to the same group', async () => {
    useSessionStore.getState().signOut();
    const { path } = seedGroup(['C7', 'C8']);
    const { router } = renderRoute(path);

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.login));
    const redirect = new URLSearchParams(router.state.location.search).get(REDIRECT_PARAM);
    expect(redirect).toBe(path);
  });
});

describe('group checkout: paying', () => {
  beforeEach(() => signInAs('USER'));

  it('pays three reservations with one request and confirms every ticket', async () => {
    const { group, path } = seedGroup(['C7', 'C8', 'C9']);
    useHoldStore.getState().add(group);
    const { user } = renderRoute(path);

    await pay(user);

    expect(await screen.findByRole('heading', { name: 'Tickets issued' })).toBeInTheDocument();
    expect(purchaseRequests).toHaveLength(1);
    expect(purchaseRequests[0]).toMatchObject({ reservationIds: group.map((item) => item.id) });
    for (const seat of ['C7', 'C8', 'C9']) expect(screen.getByText(seat)).toBeInTheDocument();
    expect(screen.getByText('$149.97')).toBeInTheDocument();
    expect(await screen.findByText('Rock Night')).toBeInTheDocument();
    expect(useHoldStore.getState().holds).toHaveLength(0);
  });

  it('sends one request on a double click', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    const { user } = renderRoute(path);
    await user.selectOptions(await screen.findByLabelText('Card brand'), 'VISA');
    await user.type(screen.getByLabelText('Card number'), '4111111111111111');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
    await user.type(screen.getByLabelText('CVV'), '123');

    await user.dblClick(screen.getByRole('button', { name: 'Pay $99.98' }));

    await screen.findByRole('heading', { name: 'Tickets issued' });
    expect(purchaseRequests).toHaveLength(1);
  });

  it('charges only the reservations that are still valid', async () => {
    const { group, path } = seedGroup(['C7', 'C8'], { C7: { status: 'EXPIRED' } });
    const { user } = renderRoute(path);

    await pay(user);

    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();
    expect(purchaseRequests[0]).toMatchObject({ reservationIds: [group[1]!.id] });
  });

  it('explains which reservation expired during the payment and lets the user pay the rest', async () => {
    const { group, path } = seedGroup(['C7', 'C8']);
    useHoldStore.getState().add(group);
    server.use(
      http.post(
        apiPath('/tickets/purchase'),
        () => {
          // La API no dice cuál venció: solo que alguna lo hizo
          group[0]!.status = 'EXPIRED';
          return HttpResponse.json(errorBody('RESERVATION_EXPIRED'), { status: 409 });
        },
        { once: true },
      ),
    );
    const { user } = renderRoute(path);

    await pay(user);

    expect(await screen.findByText(/C7 can no longer be paid/)).toBeInTheDocument();
    const payButton = await screen.findByRole('button', { name: 'Pay $49.99' });
    expect(payButton).toBeInTheDocument();
    await waitFor(() =>
      expect(useHoldStore.getState().holds.map((hold) => hold.seatLabel)).toEqual(['C8']),
    );

    await user.click(payButton);
    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();
    expect(purchaseRequests[0]).toMatchObject({ reservationIds: [group[1]!.id] });
  });

  it('blocks the payment when the first one expires, then lets the user pay the rest', async () => {
    const { group, path } = seedGroup(['C7', 'C8'], {
      C7: { expiresAt: new Date(Date.now() + 1500).toISOString() },
    });
    const { user } = renderRoute(path);
    await screen.findByLabelText('Card number');

    expect(
      await screen.findByText(/C7 can no longer be paid/, {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay $49.99' })).toBeEnabled();

    await pay(user);
    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();
    expect(purchaseRequests[0]).toMatchObject({ reservationIds: [group[1]!.id] });
  });
});

describe('group checkout: results of the payment', () => {
  beforeEach(() => signInAs('USER'));

  it('keeps the card and does not call it a failed payment while another request is charging', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    failPurchaseWith('PAYMENT_IN_PROGRESS', 409);
    const { user } = renderRoute(path);

    await pay(user);

    expect(
      await screen.findByText('Your payment is being processed. Try again in a few seconds'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Card number')).toHaveValue('4111 1111 1111 1111');
    expect(screen.getByLabelText('CVV')).toHaveValue('123');
    expect(screen.queryByText(/rejected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/already paid/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay $99.98' })).toBeEnabled();
  });

  it('shows the reservations as already paid and drops them on DUPLICATE_PAYMENT', async () => {
    const { group, path } = seedGroup(['C7', 'C8']);
    useHoldStore.getState().add(group);
    failPurchaseWith('DUPLICATE_PAYMENT', 409);
    const { user } = renderRoute(path);

    await pay(user);

    expect(await screen.findByText('These reservations are already paid')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my tickets' })).toBeInTheDocument();
    expect(useHoldStore.getState().holds).toHaveLength(0);
  });

  it('tells the user to pay fewer seats when the order is too large', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    failPurchaseWith('ORDER_AMOUNT_TOO_LARGE', 400);
    const { user } = renderRoute(path);

    await pay(user);

    expect(
      await screen.findByText(
        'The order total exceeds the maximum allowed. Pay fewer seats at once',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Card number')).toHaveValue('4111 1111 1111 1111');
  });

  it('shows the generic message for RESERVATIONS_MISMATCH', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    failPurchaseWith('RESERVATIONS_MISMATCH', 400);
    const { user } = renderRoute(path);

    await pay(user);

    expect(await screen.findByText('Something went wrong. Please try again')).toBeInTheDocument();
  });

  it('keeps the form after a card rejection and clears number and CVV', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    const { user } = renderRoute(path);

    await pay(user, '4111111111110000');

    expect(
      await screen.findByText('Payment was rejected. Please try another card'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Card number')).toHaveValue(''));
    expect(screen.getByLabelText('CVV')).toHaveValue('');
    expect(
      within(screen.getByRole('button', { name: 'Pay $99.98' })).queryByText('Paying'),
    ).toBeNull();
  });
});
