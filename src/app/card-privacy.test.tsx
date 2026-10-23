import { screen } from '@testing-library/react';
import { ROUTES } from '@/shared/config/routes';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { makeReservation } from '@/test/fixtures/reservations';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { setReservations } from '@/test/msw/purchase-handlers';
import { renderRoute, signInAs } from '@/test/render';

const CARD_NUMBER = '4111111111119999';
const CARD_NUMBER_REJECTED = '4111111111110000';
const CVV = '737';

function seed() {
  const event = makeEvent({ capacity: 30 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30, { C7: 'RESERVED' }));
  const reservation = makeReservation({ eventId: event.id });
  setReservations([reservation]);
  return reservation;
}

async function pay(user: ReturnType<typeof renderRoute>['user'], number: string) {
  await user.selectOptions(await screen.findByLabelText('Card brand'), 'VISA');
  await user.clear(screen.getByLabelText('Card number'));
  await user.type(screen.getByLabelText('Card number'), number);
  await user.clear(screen.getByLabelText('Expiry (MM/YY)'));
  await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
  await user.clear(screen.getByLabelText('CVV'));
  await user.type(screen.getByLabelText('CVV'), CVV);
  await user.click(screen.getByRole('button', { name: /^Pay / }));
}

function everythingStored(queryClient: ReturnType<typeof renderRoute>['queryClient']): string {
  return JSON.stringify({
    local: { ...localStorage },
    session: { ...sessionStorage },
    queries: queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.state),
    mutations: queryClient
      .getMutationCache()
      .getAll()
      .map((mutation) => mutation.state),
  });
}

describe('card data privacy', () => {
  beforeEach(() => signInAs('USER'));

  it('leaves no card data in the browser or the query cache after a gateway error', async () => {
    const reservation = seed();
    const { user, queryClient } = renderRoute(ROUTES.checkout(reservation.id));

    await pay(user, CARD_NUMBER);

    expect(await screen.findByText('Payment service error. Please try again')).toBeInTheDocument();
    const stored = everythingStored(queryClient);
    expect(stored).not.toContain(CARD_NUMBER);
    // Entre comillas: como valor guardado, no como parte de un UUID al azar
    expect(stored).not.toContain(`"${CVV}"`);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it('leaves no card data after a rejection', async () => {
    const reservation = seed();
    const { user, queryClient } = renderRoute(ROUTES.checkout(reservation.id));

    await pay(user, CARD_NUMBER_REJECTED);

    expect(
      await screen.findByText('Payment was rejected. Please try another card'),
    ).toBeInTheDocument();
    const stored = everythingStored(queryClient);
    expect(stored).not.toContain(CARD_NUMBER_REJECTED);
    // Entre comillas: como valor guardado, no como parte de un UUID al azar
    expect(stored).not.toContain(`"${CVV}"`);
  });

  it('shows an empty form after a reload', async () => {
    const reservation = seed();
    const first = renderRoute(ROUTES.checkout(reservation.id));
    await pay(first.user, CARD_NUMBER);
    await screen.findByText('Payment service error. Please try again');
    first.unmount();

    renderRoute(ROUTES.checkout(reservation.id));

    expect(await screen.findByLabelText('Card number')).toHaveValue('');
    expect(screen.getByLabelText('Expiry (MM/YY)')).toHaveValue('');
    expect(screen.getByLabelText('CVV')).toHaveValue('');
  });
});
