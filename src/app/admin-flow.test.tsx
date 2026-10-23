import { screen, within, fireEvent } from '@testing-library/react';
import { addMonths, format } from 'date-fns';
import { createUserRequests } from '@/test/msw/admin-handlers';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { makeReservation } from '@/test/fixtures/reservations';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { TEST_USERS } from '@/test/msw/handlers';
import { getReservation, setReservations } from '@/test/msw/purchase-handlers';
import { useSessionStore } from '@/shared/session/session.store';
import { renderRoute, signInAs } from '@/test/render';
import { ROUTES } from '@/shared/config/routes';

type User = ReturnType<typeof renderRoute>['user'];

async function pickDay(user: User, label: 'Start' | 'End', time: string) {
  const nextMonth = addMonths(new Date(), 1);
  await user.click(screen.getByRole('button', { name: new RegExp(`^${label} date`) }));
  await user.click(await screen.findByRole('button', { name: /next month/i }));
  await user.click(
    await screen.findByRole('button', {
      name: new RegExp(`${format(nextMonth, 'MMMM')} 15(st|nd|rd|th), ${nextMonth.getFullYear()}`),
    }),
  );
  fireEvent.change(screen.getByLabelText(`${label} time`), { target: { value: time } });
}

describe('admin flow', () => {
  it('creates an event, sees it in the panel, cancels it and the buyer loses the reservation', async () => {
    // Un comprador ya tiene una reserva activa en un evento existente
    const existing = makeEvent({ name: 'Jazz Evening', capacity: 30 });
    setEvents([existing]);
    setSeats(existing.id, makeSeats(30, { C7: 'RESERVED' }));
    const reservation = makeReservation({ eventId: existing.id, seat: 'C7' });
    setReservations([reservation]);

    // 1. El administrador inicia sesión y abre el panel
    const admin = renderRoute('/login');
    await admin.user.type(await screen.findByLabelText('Email'), TEST_USERS.admin.email);
    await admin.user.type(screen.getByLabelText('Password'), TEST_USERS.admin.password);
    await admin.user.click(screen.getByRole('button', { name: 'Sign in' }));
    await admin.user.click(await screen.findByRole('link', { name: 'Admin' }));
    expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument();

    // 2. Crea un evento y ve la vista previa
    await admin.user.click(screen.getByRole('link', { name: 'Create event' }));
    await admin.user.type(await screen.findByLabelText('Name'), 'Rock Night');
    await admin.user.type(screen.getByLabelText('Description'), 'Live music');
    await admin.user.selectOptions(screen.getByLabelText('Type'), 'Concert');
    await admin.user.type(screen.getByLabelText('Venue'), 'Main Hall');
    await admin.user.type(screen.getByLabelText('Price (USD)'), '49.99');
    await admin.user.type(screen.getByLabelText('Capacity'), '25');
    await admin.user.type(screen.getByLabelText('Max seats per buyer'), '4');
    expect(screen.getByText('25 seats in 3 rows')).toBeInTheDocument();
    await pickDay(admin.user, 'Start', '20:00');
    await pickDay(admin.user, 'End', '23:00');
    await admin.user.click(screen.getByRole('button', { name: 'Create event' }));

    // 3. Llega al detalle y lo ve en el panel
    expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
    await admin.user.click(screen.getByRole('link', { name: 'Admin' }));
    const row = (await screen.findByRole('link', { name: 'Rock Night' })).closest('li');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Active')).toBeInTheDocument();

    // 4. Cancela "Jazz Evening", el de la reserva activa
    await admin.user.click(
      await screen.findByRole('button', { name: 'Cancel event Jazz Evening' }),
    );
    await admin.user.click(await screen.findByRole('button', { name: 'Yes, cancel event' }));
    expect(await screen.findByText(/Event cancelled:/)).toBeInTheDocument();
    await admin.user.click(screen.getByRole('link', { name: 'Jazz Evening' }));
    expect(await screen.findByText('This event has been cancelled')).toBeInTheDocument();
    admin.unmount();

    // 5. El comprador vuelve a su checkout: la reserva ya no existe y el seat quedó libre
    expect(getReservation(reservation.id)?.status).toBe('CANCELLED');
    useSessionStore.getState().signOut();
    signInAs('USER');
    renderRoute(ROUTES.checkout(reservation.id));
    expect(await screen.findByText('This reservation was cancelled')).toBeInTheDocument();
    // Flujo largo: margen para cuando corre con toda la suite
  }, 40_000);

  it('does not keep the password of a new user anywhere in the browser', async () => {
    signInAs('ADMIN');
    const { user, queryClient } = renderRoute(ROUTES.adminNewUser);
    const password = 'Sup3r-Secret-Pw-42';

    await user.type(await screen.findByLabelText('Email'), 'boss@mail.com');
    await user.type(screen.getByLabelText('Password'), password);
    await user.selectOptions(screen.getByLabelText('Role'), 'Admin');
    await user.click(screen.getByRole('button', { name: 'Create user' }));
    await screen.findByText('User created: boss@mail.com (Admin)');

    expect(createUserRequests[0]?.password).toBe(password);
    const stored = JSON.stringify({
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
    expect(stored).not.toContain(password);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });
});
