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

function seed() {
  const event = makeEvent({ name: 'Rock Night', capacity: 30 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30, { C7: 'RESERVED' }));
  const reservation = makeReservation({ eventId: event.id });
  setReservations([reservation]);
  useHoldStore.getState().add([reservation]);
  return { event, reservation };
}

async function openDialog(user: ReturnType<typeof renderRoute>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Cancel reservation' }));
  return screen.findByRole('alertdialog');
}

describe('CancelReservation', () => {
  beforeEach(() => signInAs('USER'));

  it('cancels after confirming, drops the hold and returns to the event', async () => {
    const { event, reservation } = seed();
    const { user, router } = renderRoute(ROUTES.checkout(reservation.id));

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel it' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.eventDetail(event.id)));
    expect(await screen.findByText('Reservation cancelled')).toBeInTheDocument();
    expect(useHoldStore.getState().holds).toHaveLength(0);
    expect(getReservation(reservation.id)?.status).toBe('CANCELLED_BY_USER');
  });

  it('drops only the cancelled reservation and keeps the others in progress', async () => {
    const { event, reservation } = seed();
    const other = makeReservation({ eventId: event.id, seat: 'C8' });
    setReservations([reservation, other]);
    useHoldStore.getState().add([other]);
    const { user, router } = renderRoute(ROUTES.checkout(reservation.id));

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel it' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.eventDetail(event.id)));
    expect(useHoldStore.getState().holds.map((hold) => hold.reservationId)).toEqual([other.id]);
    expect(
      await screen.findByRole('region', { name: 'Reservation in progress' }),
    ).toHaveTextContent('Seat C8 is held');
  });

  it('sends nothing when the user closes the dialog', async () => {
    const { reservation } = seed();
    const { user, router } = renderRoute(ROUTES.checkout(reservation.id));

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Keep reservation' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(getReservation(reservation.id)?.status).toBe('ACTIVE');
    expect(router.state.location.pathname).toBe(ROUTES.checkout(reservation.id));
    expect(useHoldStore.getState().holds).toHaveLength(1);
  });

  it('is disabled while a payment is in progress', async () => {
    const { reservation } = seed();
    server.use(
      http.post(apiPath('/tickets/purchase'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return HttpResponse.json(errorBody('PAYMENT_GATEWAY_ERROR'), { status: 502 });
      }),
    );
    const { user } = renderRoute(ROUTES.checkout(reservation.id));

    await user.selectOptions(await screen.findByLabelText('Card brand'), 'VISA');
    await user.type(screen.getByLabelText('Card number'), '4111111111111111');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
    await user.type(screen.getByLabelText('CVV'), '123');
    await user.click(screen.getByRole('button', { name: /^Pay / }));

    expect(screen.getByRole('button', { name: 'Cancel reservation' })).toBeDisabled();
    expect(await screen.findByText('Payment service error. Please try again')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel reservation' })).toBeEnabled();
  });

  it('goes to My tickets when the reservation was already paid (409)', async () => {
    const { reservation } = seed();
    server.use(
      http.post(apiPath('/reservations/:id/cancel'), () =>
        HttpResponse.json(errorBody('RESERVATION_ALREADY_CONFIRMED'), { status: 409 }),
      ),
    );
    const { user, router } = renderRoute(ROUTES.checkout(reservation.id));

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel it' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.myTickets));
    expect(useHoldStore.getState().holds).toHaveLength(0);
  });

  it('shows the cancelled state when it was already cancelled elsewhere (409)', async () => {
    const { reservation } = seed();
    server.use(
      http.post(apiPath('/reservations/:id/cancel'), () => {
        const stored = getReservation(reservation.id);
        if (stored) stored.status = 'CANCELLED_BY_USER';
        return HttpResponse.json(errorBody('RESERVATION_ALREADY_CANCELLED'), { status: 409 });
      }),
    );
    const { user } = renderRoute(ROUTES.checkout(reservation.id));

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel it' }));

    expect(await screen.findByText('This reservation was cancelled')).toBeInTheDocument();
  });
});
