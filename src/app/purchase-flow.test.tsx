import { screen } from '@testing-library/react';
import { useHoldStore } from '@/features/reservations/hold.store';
import { useSeatSelectionStore } from '@/features/seats/store';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { TEST_USERS } from '@/test/msw/handlers';
import { renderRoute, signInAs } from '@/test/render';

type User = ReturnType<typeof renderRoute>['user'];

async function fillCard(user: User, number: string) {
  await user.selectOptions(await screen.findByLabelText('Card brand'), 'VISA');
  await user.type(screen.getByLabelText('Card number'), number);
  await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
  await user.type(screen.getByLabelText('CVV'), '123');
}

const payButton = () => screen.getByRole('button', { name: /^Pay / });

function seed() {
  const event = makeEvent({ name: 'Rock Night', price: 49.99, capacity: 30 });
  setEvents([event]);
  setSeats(event.id, makeSeats(30));
  return event;
}

describe('purchase flow', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('goes from signing in to the ticket in My tickets', async () => {
    const event = seed();
    const { user, router } = renderRoute('/login');

    // 1. Inicia sesión y abre el evento
    await user.type(await screen.findByLabelText('Email'), TEST_USERS.user.email);
    await user.type(screen.getByLabelText('Password'), TEST_USERS.user.password);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(await screen.findByRole('link', { name: /Rock Night/ }));

    // 2. Elige un seat y lo reserva
    await user.click(await screen.findByRole('button', { name: 'Seat C7, Available' }));
    await user.click(screen.getByRole('button', { name: 'Reserve' }));
    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/checkout\//);

    // 3. Paga con una tarjeta aprobada
    await fillCard(user, '4111 1111 1111 1111');
    await user.click(payButton());
    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();

    // 4. El ticket aparece en "My tickets"
    await user.click(screen.getByRole('link', { name: 'View my tickets' }));
    expect(await screen.findByRole('link', { name: 'Rock Night' })).toHaveAttribute(
      'href',
      `/events/${event.id}`,
    );
    expect(screen.getByText('C7')).toBeInTheDocument();
    expect(useHoldStore.getState().hold).toBeNull();
    // Flujo largo: margen para cuando corre con toda la suite
  }, 20_000);

  it('lets the user retry with another card after a rejection', async () => {
    const event = seed();
    signInAs('USER');
    const { user } = renderRoute(`/events/${event.id}`);

    await user.click(await screen.findByRole('button', { name: 'Seat C7, Available' }));
    await user.click(screen.getByRole('button', { name: 'Reserve' }));
    await screen.findByRole('heading', { name: 'Checkout' });

    await fillCard(user, '4111 1111 1111 0000');
    await user.click(payButton());
    expect(
      await screen.findByText('Payment was rejected. Please try another card'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Card number')).toHaveValue('');

    await user.type(screen.getByLabelText('Card number'), '4111111111111111');
    await user.type(screen.getByLabelText('CVV'), '123');
    await user.click(payButton());

    expect(await screen.findByRole('heading', { name: 'Ticket issued' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'View my tickets' }));
    expect(await screen.findByText('C7')).toBeInTheDocument();
  }, 20_000);
});
