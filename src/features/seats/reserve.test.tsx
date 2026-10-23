import { screen, waitFor, within } from '@testing-library/react';
import { useHoldStore } from '@/features/reservations/hold.store';
import { ROUTES } from '@/shared/config/routes';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { makeReservation } from '@/test/fixtures/reservations';
import { setMedia } from '@/test/media';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { reserveRequests, setReservations } from '@/test/msw/purchase-handlers';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';
import { http, HttpResponse } from 'msw';
import { useSeatSelectionStore } from './store';

const checkoutStub = [{ path: ROUTES.checkoutPattern, element: <p>Checkout page</p> }];

function seed(statusByLabel = {}) {
  const event = makeEvent({ name: 'Rock Night', price: 49.99, capacity: 30 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30, statusByLabel));
  return event;
}

async function selectSeat(user: ReturnType<typeof renderRoute>['user'], label = 'C7') {
  await user.click(await screen.findByRole('button', { name: `Seat ${label}, Available` }));
}

describe('reserving a seat', () => {
  beforeEach(() => signInAs('USER'));
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('reserves the seat, stores the hold and opens the checkout', async () => {
    const event = seed();
    const { user, router } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeat(user);

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(await screen.findByText('Checkout page')).toBeInTheDocument();
    const hold = useHoldStore.getState().hold;
    expect(hold?.seatLabel).toBe('C7');
    expect(router.state.location.pathname).toBe(ROUTES.checkout(hold?.reservationId ?? ''));
    expect(useSeatSelectionStore.getState().seatLabel).toBeNull();
    expect(reserveRequests).toEqual([{ eventId: event.id, seat: 'C7' }]);
  });

  it('shows "Reserving..." and sends one request on a double click', async () => {
    const event = seed();
    const { user } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeat(user);

    await user.dblClick(screen.getByRole('button', { name: 'Reserve' }));

    await screen.findByText('Checkout page');
    expect(reserveRequests).toHaveLength(1);
  });

  it('shows "Reserving..." while the request is pending', async () => {
    const event = seed();
    server.use(
      http.post(apiPath('/reservations'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(makeReservation({ eventId: event.id }), { status: 201 });
      }),
    );
    const { user } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeat(user);

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(screen.getByRole('button', { name: 'Reserving...' })).toBeDisabled();
    await screen.findByText('Checkout page');
  });

  it('tells the user when the seat was taken, refreshes the map and drops the selection', async () => {
    const event = seed();
    server.use(
      http.post(apiPath('/reservations'), () =>
        HttpResponse.json(errorBody('SEAT_NOT_AVAILABLE'), { status: 409 }),
      ),
    );
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeat(user);

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(
      await screen.findByText('This seat is no longer available. Please choose another one'),
    ).toBeInTheDocument();
    await waitFor(() => expect(useSeatSelectionStore.getState().seatLabel).toBeNull());
    expect(screen.queryByRole('button', { name: 'Reserve' })).not.toBeInTheDocument();
  });

  it('tells the user when the event no longer accepts reservations', async () => {
    const event = seed();
    server.use(
      http.post(apiPath('/reservations'), () =>
        HttpResponse.json(errorBody('EVENT_NOT_ACTIVE'), { status: 409 }),
      ),
    );
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeat(user);

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(
      await screen.findByText('This event is no longer available for booking'),
    ).toBeInTheDocument();
  });

  it('keeps the selection after a network failure so the user can retry', async () => {
    const event = seed();
    server.use(http.post(apiPath('/reservations'), () => HttpResponse.error()));
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeat(user);

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(
      await screen.findByText('Cannot reach the server. Check your connection and try again'),
    ).toBeInTheDocument();
    expect(useSeatSelectionStore.getState().seatLabel).toBe('C7');
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeEnabled();
  });
});

describe('one reservation at a time', () => {
  beforeEach(() => signInAs('USER'));
  afterEach(() => useSeatSelectionStore.getState().clear());

  function holdSeat(eventId: string) {
    const reservation = makeReservation({ eventId, seat: 'C7' });
    setReservations([reservation]);
    useHoldStore.getState().start(reservation);
    return reservation;
  }

  it('disables Reserve and links to the checkout while a hold exists', async () => {
    const event = seed({ C7: 'RESERVED' });
    const reservation = holdSeat(event.id);
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeat(user, 'B2');

    const reserve = screen.getByRole('button', { name: 'Reserve' });
    expect(reserve).toBeDisabled();
    const pass = within(reserve.closest<HTMLElement>('[data-slot="laminate"]')!);
    expect(
      pass.getByText(/You are holding C7\. Finish or cancel it to reserve another/),
    ).toBeInTheDocument();
    expect(pass.getByRole('link', { name: 'Continue to checkout' })).toHaveAttribute(
      'href',
      ROUTES.checkout(reservation.id),
    );
  });

  it('shows the same notice in the compact pass', async () => {
    setMedia({ wide: false });
    const event = seed({ C7: 'RESERVED' });
    holdSeat(event.id);
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeat(user, 'B2');

    expect(screen.getByRole('button', { name: 'Reserve' })).toBeDisabled();
    expect(screen.getByText(/You are holding C7/)).toBeInTheDocument();
  });
});
