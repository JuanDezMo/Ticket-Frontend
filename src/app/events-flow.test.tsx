import { screen, within } from '@testing-library/react';
import { useSeatSelectionStore } from '@/features/seats/store';
import { useSessionStore } from '@/shared/session/session.store';
import { makeEvent, makeSeats } from '@/test/fixtures/events';
import { setEvents, setSeats } from '@/test/msw/event-handlers';
import { TEST_USERS } from '@/test/msw/handlers';
import { renderRoute, signInAs } from '@/test/render';

describe('events flow', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  it('keeps the filter through the login when going back from the detail', async () => {
    const concert = makeEvent({ name: 'Rock Night', type: 'CONCERT' });
    setEvents([concert, makeEvent({ name: 'Tech Meetup', type: 'MEETUP' })]);
    setSeats(concert.id, makeSeats(20));
    const { user, router } = renderRoute('/');

    // 1. Filtra por tipo y abre el evento
    await screen.findByRole('heading', { name: 'Tech Meetup' });
    await user.selectOptions(screen.getByLabelText('Type'), 'Concert');
    await user.click(await screen.findByRole('link', { name: /Rock Night/ }));

    // 2. Sin sesión no ve los seats; inicia sesión desde el enlace
    const seatMap = await screen.findByRole('region', { name: 'Seat map' });
    await user.click(within(seatMap).getByRole('link', { name: 'Sign in' }));
    await user.type(await screen.findByLabelText('Email'), TEST_USERS.user.email);
    await user.type(screen.getByLabelText('Password'), TEST_USERS.user.password);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // 3. Vuelve al evento y ve el mapa
    expect(await screen.findByText('20 of 20 seats available')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/events/${concert.id}`);

    // 4. "Back to events" conserva el filtro aunque se pasó por el login
    await user.click(screen.getByRole('link', { name: 'Back to events' }));
    expect(router.state.location.search).toBe('?type=CONCERT');
    expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tech Meetup' })).not.toBeInTheDocument();
  });

  it('keeps the filter when going back from the detail', async () => {
    const concert = makeEvent({ name: 'Rock Night', type: 'CONCERT' });
    setEvents([concert, makeEvent({ name: 'Tech Meetup', type: 'MEETUP' })]);
    setSeats(concert.id, makeSeats(20));
    signInAs('USER');
    const { user, router } = renderRoute('/?type=CONCERT');

    await user.click(await screen.findByRole('link', { name: /Rock Night/ }));
    await screen.findByText('20 of 20 seats available');
    await user.click(screen.getByRole('link', { name: 'Back to events' }));

    expect(router.state.location.search).toBe('?type=CONCERT');
    expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tech Meetup' })).not.toBeInTheDocument();
  });

  it('clears the selected seat when the session ends', async () => {
    signInAs('USER');
    renderRoute('/');
    useSeatSelectionStore.getState().toggle('event-1', 'A1');

    useSessionStore.getState().signOut();

    expect(useSeatSelectionStore.getState()).toMatchObject({ eventId: null, seatLabel: null });
  });
});
