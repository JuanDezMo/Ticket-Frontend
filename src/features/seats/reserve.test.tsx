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

function seed(statusByLabel = {}, maxSeatsPerUser = 4) {
  const event = makeEvent({ name: 'Rock Night', price: 49.99, capacity: 30, maxSeatsPerUser });
  setEvents([event]);
  setSeats(event.id, makeSeats(30, statusByLabel));
  return event;
}

type User = ReturnType<typeof renderRoute>['user'];

async function selectSeats(user: User, ...labels: string[]) {
  for (const label of labels) {
    await user.click(await screen.findByRole('button', { name: `Seat ${label}, Available` }));
  }
}

const selected = () => useSeatSelectionStore.getState().seatLabels;
const holds = () => useHoldStore.getState().holds;

describe('reserving seats', () => {
  beforeEach(() => signInAs('USER'));
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('reserves one seat, stores the hold and opens its checkout', async () => {
    const event = seed();
    const { user, router } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeats(user, 'C7');

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(await screen.findByText('Checkout page')).toBeInTheDocument();
    expect(holds().map((hold) => hold.seatLabel)).toEqual(['C7']);
    expect(router.state.location.pathname).toBe(ROUTES.checkout(holds()[0]?.reservationId ?? ''));
    expect(selected()).toEqual([]);
    expect(reserveRequests).toEqual([{ eventId: event.id, seats: ['C7'] }]);
  });

  it('reserves several seats in one request and opens the checkout of the first', async () => {
    const event = seed();
    const { user, router } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeats(user, 'C7', 'C8');

    await user.click(screen.getByRole('button', { name: 'Reserve 2 seats' }));

    expect(await screen.findByText('Checkout page')).toBeInTheDocument();
    expect(reserveRequests).toEqual([{ eventId: event.id, seats: ['C7', 'C8'] }]);
    expect(holds().map((hold) => hold.seatLabel)).toEqual(['C7', 'C8']);
    expect(router.state.location.pathname).toBe(ROUTES.checkout(holds()[0]?.reservationId ?? ''));
    expect(selected()).toEqual([]);
  });

  it('reserves the maximum of 8 seats in one request', async () => {
    const event = seed({}, 8);
    const { user } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeats(user, 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8');

    await user.click(screen.getByRole('button', { name: 'Reserve 8 seats' }));

    await screen.findByText('Checkout page');
    expect(reserveRequests).toHaveLength(1);
    expect(reserveRequests[0]?.seats).toHaveLength(8);
    expect(holds()).toHaveLength(8);
  });

  it('shows "Reserving..." and sends one request on a double click', async () => {
    const event = seed();
    const { user } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeats(user, 'C7');

    await user.dblClick(screen.getByRole('button', { name: 'Reserve' }));

    await screen.findByText('Checkout page');
    expect(reserveRequests).toHaveLength(1);
  });

  it('shows "Reserving..." while the request is pending', async () => {
    const event = seed();
    server.use(
      http.post(apiPath('/reservations'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(
          { reservations: [makeReservation({ eventId: event.id })] },
          { status: 201 },
        );
      }),
    );
    const { user } = renderRoute(`/events/${event.id}`, checkoutStub);
    await selectSeats(user, 'C7');

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(screen.getByRole('button', { name: 'Reserving...' })).toBeDisabled();
    await screen.findByText('Checkout page');
  });

  it('reserves nothing when one seat of the batch was taken, and keeps the others selected', async () => {
    const event = seed();
    server.use(
      http.post(apiPath('/reservations'), () => {
        // Otro usuario tomó C8 un instante antes
        setSeats(event.id, makeSeats(30, { C8: 'RESERVED' }));
        return HttpResponse.json(errorBody('SEAT_NOT_AVAILABLE'), { status: 409 });
      }),
    );
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7', 'C8');

    await user.click(screen.getByRole('button', { name: 'Reserve 2 seats' }));

    expect(
      await screen.findByText('This seat is no longer available. Please choose another one'),
    ).toBeInTheDocument();
    await waitFor(() => expect(selected()).toEqual(['C7']));
    expect(screen.getByText('C8 was just taken. Pick another seat')).toBeInTheDocument();
    expect(holds()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeEnabled();
  });

  it('tells the user when the event no longer accepts reservations', async () => {
    const event = seed();
    server.use(
      http.post(apiPath('/reservations'), () =>
        HttpResponse.json(errorBody('EVENT_NOT_ACTIVE'), { status: 409 }),
      ),
    );
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7');

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(
      await screen.findByText('This event is no longer available for booking'),
    ).toBeInTheDocument();
  });

  it('keeps the selection after a network failure so the user can retry', async () => {
    const event = seed();
    server.use(http.post(apiPath('/reservations'), () => HttpResponse.error()));
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7', 'C8');

    await user.click(screen.getByRole('button', { name: 'Reserve 2 seats' }));

    expect(
      await screen.findByText('Cannot reach the server. Check your connection and try again'),
    ).toBeInTheDocument();
    expect(selected()).toEqual(['C7', 'C8']);
    expect(screen.getByRole('button', { name: 'Reserve 2 seats' })).toBeEnabled();
    expect(holds()).toHaveLength(0);
  });

  it('explains the event limit with the number of the event when the server refuses', async () => {
    const event = seed({}, 3);
    server.use(
      http.post(apiPath('/reservations'), () =>
        HttpResponse.json(errorBody('SEAT_LIMIT_REACHED', 'You can hold up to 99 seats'), {
          status: 409,
        }),
      ),
    );
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7', 'C8');

    await user.click(screen.getByRole('button', { name: 'Reserve 2 seats' }));

    expect(
      await screen.findByText('You can hold up to 3 seats for this event'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/up to 99/)).not.toBeInTheDocument();
    expect(selected()).toEqual(['C7', 'C8']);
  });

  it('says "seat" in singular when the event limit is 1', async () => {
    const event = seed({}, 1);
    server.use(
      http.post(apiPath('/reservations'), () =>
        HttpResponse.json(errorBody('SEAT_LIMIT_REACHED'), { status: 409 }),
      ),
    );
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7');

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(await screen.findByText('You can hold up to 1 seat for this event')).toBeInTheDocument();
  });

  it('explains the global limit and keeps the selection', async () => {
    const event = seed();
    server.use(
      http.post(apiPath('/reservations'), () =>
        HttpResponse.json(errorBody('HOLD_LIMIT_REACHED'), { status: 409 }),
      ),
    );
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7');

    await user.click(screen.getByRole('button', { name: 'Reserve' }));

    expect(
      await screen.findByText(
        'You have too many seats on hold. Pay or cancel some to reserve more',
      ),
    ).toBeInTheDocument();
    expect(selected()).toEqual(['C7']);
  });
});

describe('the seat limit of the event', () => {
  beforeEach(() => signInAs('USER'));
  afterEach(() => useSeatSelectionStore.getState().clear());

  function holdSeats(eventId: string, ...labels: string[]) {
    const reservations = labels.map((seat) => makeReservation({ eventId, seat }));
    setReservations(reservations);
    useHoldStore.getState().add(reservations);
    return reservations;
  }

  it('selects up to the limit and refuses the next seat with an explanation', async () => {
    const event = seed({}, 3);
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C1', 'C2', 'C3');
    expect(screen.getByText('3 of 3 seats selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Seat C4, Available' }));

    expect(selected()).toEqual(['C1', 'C2', 'C3']);
    expect(screen.getByText('You can select up to 3 seats')).toBeInTheDocument();
  });

  it('lets the user swap a seat once the limit is reached', async () => {
    const event = seed({}, 2);
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C1', 'C2');

    await user.click(screen.getByRole('button', { name: 'Seat C1, Selected' }));
    await user.click(screen.getByRole('button', { name: 'Seat C3, Available' }));

    expect(selected()).toEqual(['C2', 'C3']);
  });

  it('replaces the selection when the event allows one seat', async () => {
    const event = seed({}, 1);
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7', 'B2');

    expect(selected()).toEqual(['B2']);
    expect(screen.queryByText(/seats selected/)).not.toBeInTheDocument();
  });

  it('counts what the user already holds in this event', async () => {
    const event = seed({ C1: 'RESERVED' }, 3);
    holdSeats(event.id, 'C1');
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C2', 'C3');

    expect(screen.getByText('2 of 2 seats selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Seat C4, Available' }));
    expect(selected()).toEqual(['C2', 'C3']);
  });

  it('does not count what the user holds in another event', async () => {
    const event = seed({}, 2);
    holdSeats(crypto.randomUUID(), 'A1', 'A2');
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C1', 'C2');

    expect(selected()).toEqual(['C1', 'C2']);
    expect(screen.getByRole('button', { name: 'Reserve 2 seats' })).toBeEnabled();
  });

  it('disables Reserve and links to the checkout when the user holds the maximum', async () => {
    const event = seed({ C7: 'RESERVED', C8: 'RESERVED' }, 2);
    const [first] = holdSeats(event.id, 'C7', 'C8');
    const { user } = renderRoute(`/events/${event.id}`);
    await screen.findByRole('button', { name: 'Seat B2, Available' });

    await user.click(screen.getByRole('button', { name: 'Seat B2, Available' }));

    const reserve = screen.getByRole('button', { name: 'Reserve' });
    expect(reserve).toBeDisabled();
    const pass = within(reserve.closest<HTMLElement>('[data-slot="laminate"]')!);
    expect(
      pass.getByText(
        /You are holding 2 seats, the most for this event\. Finish or cancel them to reserve more/,
      ),
    ).toBeInTheDocument();
    expect(pass.getByRole('link', { name: 'Continue to checkout' })).toHaveAttribute(
      'href',
      ROUTES.checkout(first?.id ?? ''),
    );
    expect(selected()).toEqual([]);
  });

  it('shows the same notice in the compact pass', async () => {
    setMedia({ wide: false });
    const event = seed({ C7: 'RESERVED' }, 1);
    holdSeats(event.id, 'C7');
    renderRoute(`/events/${event.id}`);

    expect(await screen.findByRole('button', { name: 'Reserve' })).toBeDisabled();
    expect(screen.getByText(/You are holding 1 seat, the most for this event/)).toBeInTheDocument();
  });

  it('announces how many seats can be picked before choosing', async () => {
    const many = seed({}, 4);
    const { unmount } = renderRoute(`/events/${many.id}`);
    expect(
      await screen.findByText(
        'Pick up to 4 seats. Once reserved, they are held for 10 minutes while you pay.',
      ),
    ).toBeInTheDocument();
    unmount();

    const one = seed({}, 1);
    renderRoute(`/events/${one.id}`);
    expect(
      await screen.findByText(
        'Pick a seat. Once reserved, it is held for 10 minutes while you pay.',
      ),
    ).toBeInTheDocument();
  });
});

describe('the selection pass with several seats', () => {
  beforeEach(() => signInAs('USER'));
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('lists the seats, the total and the count', async () => {
    const event = seed();
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'C7', 'C8');

    expect(screen.getByText('C7, C8')).toBeInTheDocument();
    expect(screen.getByText('$99.98')).toBeInTheDocument();
    expect(screen.getByText('2 of 4 seats selected')).toBeInTheDocument();
    expect(screen.getByText('Selected seats: C7, C8')).toBeInTheDocument();
  });

  it('shows three codes and "+5" in the compact pass, and all of them in Details', async () => {
    setMedia({ wide: false });
    const event = seed({}, 8);
    const { user } = renderRoute(`/events/${event.id}`);
    await selectSeats(user, 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8');

    expect(screen.getByText('A1, A2, A3')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reserve 8 seats' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Details/ }));
    expect(screen.getByText('Seats: A1, A2, A3, A4, A5, A6, A7, A8')).toBeInTheDocument();
  });
});
