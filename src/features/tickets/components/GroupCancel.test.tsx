import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useHoldStore } from '@/features/reservations/hold.store';
import { ROUTES } from '@/shared/config/routes';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { makeReservation } from '@/test/fixtures/reservations';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { getReservation, setReservations } from '@/test/msw/purchase-handlers';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

type User = ReturnType<typeof renderRoute>['user'];

function seedGroup(labels: string[]) {
  const event = makeEvent({ name: 'Rock Night', price: 49.99, capacity: 30, maxSeatsPerUser: 8 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30));
  const group = labels.map((seat) => makeReservation({ eventId: event.id, seat, amount: 49.99 }));
  setReservations(group);
  useHoldStore.getState().add(group);
  return { event, group, path: ROUTES.checkoutFor(group.map((item) => item.id)) };
}

async function confirm(user: User, button: string, yes: string) {
  await user.click(await screen.findByRole('button', { name: button }));
  const dialog = await screen.findByRole('alertdialog');
  await user.click(within(dialog).getByRole('button', { name: yes }));
}

describe('removing a seat from the group', () => {
  beforeEach(() => signInAs('USER'));

  it('cancels only that reservation, leaves the link and recalculates the total', async () => {
    const { group, path } = seedGroup(['C7', 'C8', 'C9']);
    const { user, router } = renderRoute(path);

    await confirm(user, 'Remove C8', 'Yes, remove it');

    expect(await screen.findByRole('button', { name: 'Pay $99.98' })).toBeInTheDocument();
    expect(getReservation(group[1]!.id)?.status).toBe('CANCELLED_BY_USER');
    expect(getReservation(group[0]!.id)?.status).toBe('ACTIVE');
    expect(getReservation(group[2]!.id)?.status).toBe('ACTIVE');
    expect(router.state.location.search).toBe(`?ids=${group[0]!.id},${group[2]!.id}`);
    expect(useHoldStore.getState().holds.map((hold) => hold.seatLabel)).toEqual(['C7', 'C9']);
    expect(screen.queryByText('C8')).not.toBeInTheDocument();
  });

  it('goes to the single-reservation link when one is left', async () => {
    const { group, path } = seedGroup(['C7', 'C8']);
    const { user, router } = renderRoute(path);

    await confirm(user, 'Remove C7', 'Yes, remove it');

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.checkout(group[1]!.id)));
    expect(await screen.findByRole('button', { name: 'Pay $49.99' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel reservation' })).toBeInTheDocument();
  });

  it('sends nothing when the user closes the dialog', async () => {
    const { group, path } = seedGroup(['C7', 'C8']);
    const { user } = renderRoute(path);

    await user.click(await screen.findByRole('button', { name: 'Remove C7' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Keep seat' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(getReservation(group[0]!.id)?.status).toBe('ACTIVE');
    expect(screen.getByRole('button', { name: 'Pay $99.98' })).toBeInTheDocument();
  });

  it('has no Remove buttons when there is a single reservation', async () => {
    const { path } = seedGroup(['C7']);
    renderRoute(path);

    expect(await screen.findByRole('button', { name: 'Cancel reservation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
  });

  it('disables Remove and Cancel all while a payment is in progress', async () => {
    const { path } = seedGroup(['C7', 'C8']);
    server.use(
      http.post(apiPath('/tickets/purchase'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return HttpResponse.json(errorBody('PAYMENT_GATEWAY_ERROR'), { status: 502 });
      }),
    );
    const { user } = renderRoute(path);
    await user.selectOptions(await screen.findByLabelText('Card brand'), 'VISA');
    await user.type(screen.getByLabelText('Card number'), '4111111111111111');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
    await user.type(screen.getByLabelText('CVV'), '123');

    await user.click(screen.getByRole('button', { name: 'Pay $99.98' }));

    expect(screen.getByRole('button', { name: 'Remove C7' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove C8' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel all' })).toBeDisabled();
    await screen.findByText('Payment service error. Please try again');
  });
});

describe('cancelling the whole group', () => {
  beforeEach(() => signInAs('USER'));

  it('cancels every reservation, returns to the event and frees the seats', async () => {
    const { event, group, path } = seedGroup(['C7', 'C8']);
    const { user, router } = renderRoute(path);

    await confirm(user, 'Cancel all', 'Yes, cancel it');

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.eventDetail(event.id)));
    expect(await screen.findByText('Reservations cancelled')).toBeInTheDocument();
    expect(group.map((item) => getReservation(item.id)?.status)).toEqual([
      'CANCELLED_BY_USER',
      'CANCELLED_BY_USER',
    ]);
    expect(useHoldStore.getState().holds).toHaveLength(0);
  });

  it('keeps what could not be cancelled and says why', async () => {
    const { group, path } = seedGroup(['C7', 'C8']);
    server.use(
      http.post(apiPath('/reservations/:id/cancel'), ({ params }) =>
        params.id === group[1]!.id
          ? HttpResponse.json(errorBody('RESERVATION_EXPIRED'), { status: 409 })
          : HttpResponse.json({ ...group[0], status: 'CANCELLED_BY_USER' }),
      ),
    );
    const { user, router } = renderRoute(path);

    await confirm(user, 'Cancel all', 'Yes, cancel it');

    expect(
      await screen.findByText('Your reservation has expired. Please choose a seat again'),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.checkoutGroup);
    expect(useHoldStore.getState().holds.map((hold) => hold.seatLabel)).toEqual(['C8']);
  });

  it('says "Reservation cancelled" for a single reservation', async () => {
    const { event, path } = seedGroup(['C7']);
    const { user, router } = renderRoute(path);

    await confirm(user, 'Cancel reservation', 'Yes, cancel it');

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.eventDetail(event.id)));
    expect(await screen.findByText('Reservation cancelled')).toBeInTheDocument();
  });
});
