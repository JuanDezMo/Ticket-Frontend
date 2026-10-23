import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useSeatSelectionStore } from '@/features/seats/store';
import { useEventListStore } from '../store';
import { daysFromNow, makeEvent, makeSeats } from '@/test/fixtures/events';
import { seatRequests, setEvents, setSeats } from '@/test/msw/event-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

function seedEvent(overrides = {}, seats = makeSeats(20)) {
  const event = makeEvent({ name: 'Rock Night', capacity: seats.length, ...overrides });
  setEvents([event]);
  setSeats(event.id, seats);
  return event;
}

describe('EventDetailPage', () => {
  afterEach(() => useSeatSelectionStore.getState().clear());

  describe('details', () => {
    it('shows the event to a guest without loading seats', async () => {
      const event = seedEvent({ description: 'Loud music', venue: 'Main Hall' });
      renderRoute(`/events/${event.id}`);

      expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
      expect(screen.getByText('Loud music')).toBeInTheDocument();
      expect(screen.getByText('Main Hall')).toBeInTheDocument();
      expect(screen.getByText('20 seats')).toBeInTheDocument();
      expect(screen.getByText('Sign in to see available seats')).toBeInTheDocument();
      expect(seatRequests).toHaveLength(0);
    });

    it('shows "Event not found" for an invalid id without calling the API', async () => {
      const onRequest = vi.fn();
      server.events.on('request:start', onRequest);
      renderRoute('/events/abc');

      expect(await screen.findByText('Event not found')).toBeInTheDocument();
      expect(onRequest).not.toHaveBeenCalled();
      server.events.removeAllListeners();
    });

    it('shows "Event not found" when the API answers 404', async () => {
      renderRoute(`/events/${crypto.randomUUID()}`);
      expect(await screen.findByText('Event not found')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to events' })).toHaveAttribute('href', '/');
    });

    it('warns when the event is cancelled', async () => {
      const event = seedEvent({ status: 'CANCELLED' });
      renderRoute(`/events/${event.id}`);
      expect(await screen.findByText('This event has been cancelled')).toBeInTheDocument();
    });

    it('warns when the event has already started', async () => {
      const event = seedEvent({ startDate: daysFromNow(0, -1), endDate: daysFromNow(0, 2) });
      renderRoute(`/events/${event.id}`);
      expect(await screen.findByText('This event has already started')).toBeInTheDocument();
    });

    it('goes back to the last filters after a reload of the detail', async () => {
      const event = seedEvent({ type: 'CONCERT' });
      // El listado quedó guardado en sessionStorage antes de recargar
      sessionStorage.setItem(
        'ticket-event-list',
        JSON.stringify({ state: { lastSearch: '?type=CONCERT' }, version: 0 }),
      );
      await useEventListStore.persist.rehydrate();
      renderRoute(`/events/${event.id}`);

      expect(await screen.findByRole('link', { name: 'Back to events' })).toHaveAttribute(
        'href',
        '/?type=CONCERT',
      );
    });

    it('goes back to "/" when the list was not used in this tab', async () => {
      const event = seedEvent();
      renderRoute(`/events/${event.id}`);

      expect(await screen.findByRole('link', { name: 'Back to events' })).toHaveAttribute(
        'href',
        '/',
      );
    });

    it('goes back to the list keeping the filters', async () => {
      seedEvent({ type: 'CONCERT' });
      const { user, router } = renderRoute('/?type=CONCERT');

      await user.click(await screen.findByRole('link', { name: /Rock Night/ }));
      await user.click(await screen.findByRole('link', { name: 'Back to events' }));

      expect(router.state.location.search).toBe('?type=CONCERT');
      expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
    });
  });

  describe('header and guest wall', () => {
    it('shows how many seats are left to a signed-in user', async () => {
      signInAs('USER');
      const event = seedEvent({}, makeSeats(25, { A1: 'SOLD', A2: 'SOLD' }));
      renderRoute(`/events/${event.id}`);

      expect(await screen.findByText('23 left')).toBeInTheDocument();
    });

    it('explains why a guest must sign in and offers Sign in and Sign up', async () => {
      const event = seedEvent();
      renderRoute(`/events/${event.id}`);

      const wall = await screen.findByRole('region', { name: 'Seat map' });
      expect(within(wall).getByText(/Creating an account is free/)).toBeInTheDocument();
      expect(within(wall).getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
      const signUp = within(wall).getByRole('link', { name: 'Sign up' });
      expect(signUp).toHaveAttribute(
        'href',
        `/register?redirect=${encodeURIComponent(`/events/${event.id}`)}`,
      );
    });

    it('returns to the event after signing up and signing in', async () => {
      const event = seedEvent();
      const { user, router } = renderRoute(`/events/${event.id}`);

      const wall = await screen.findByRole('region', { name: 'Seat map' });
      await user.click(within(wall).getByRole('link', { name: 'Sign up' }));
      await user.type(await screen.findByLabelText('Email'), 'new@mail.com');
      await user.type(screen.getByLabelText('Password'), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      // El registro lleva al login recordando el evento
      await screen.findByRole('button', { name: 'Sign in' });
      expect(router.state.location.search).toBe(
        `?redirect=${encodeURIComponent(`/events/${event.id}`)}`,
      );
      await user.type(screen.getByLabelText('Password'), 'secret123');
      // El usuario de prueba del servidor simulado tiene su propio correo
      await user.clear(screen.getByLabelText('Email'));
      await user.type(screen.getByLabelText('Email'), 'user@mail.com');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(await screen.findByText(/seats available/)).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(`/events/${event.id}`);
    });
  });

  describe('seat map', () => {
    it('shows rows of 10 with the status in the accessible name', async () => {
      signInAs('USER');
      const event = seedEvent({}, makeSeats(25, { A2: 'SOLD', B1: 'RESERVED' }));
      renderRoute(`/events/${event.id}`);

      expect(await screen.findByText('23 of 25 seats available')).toBeInTheDocument();
      expect(
        within(screen.getByRole('group', { name: 'Row C' })).getAllByRole('button'),
      ).toHaveLength(5);
      expect(screen.getByRole('img', { name: 'Seat A2, Sold' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Seat B1, Reserved' })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent(
        'AvailableReservedSoldBlocked',
      );
    });

    it('refreshes the seats', async () => {
      signInAs('USER');
      const event = seedEvent();
      const { user } = renderRoute(`/events/${event.id}`);
      await screen.findByText('20 of 20 seats available');

      setSeats(event.id, makeSeats(20, { A1: 'SOLD', A2: 'SOLD' }));
      await user.click(screen.getByRole('button', { name: 'Refresh' }));

      expect(await screen.findByText('18 of 20 seats available')).toBeInTheDocument();
    });

    it('keeps the event visible when the seats fail to load', async () => {
      signInAs('USER');
      const event = seedEvent();
      server.use(
        http.get(apiPath('/events/:id/seats'), () =>
          HttpResponse.json(errorBody('INTERNAL_ERROR'), { status: 500 }),
        ),
      );
      renderRoute(`/events/${event.id}`);

      expect(
        await screen.findByText('Something went wrong. Please try again', {}, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });
  });

  describe('seat selection', () => {
    it('selects, replaces and deselects a seat', async () => {
      signInAs('USER');
      const event = seedEvent();
      const { user } = renderRoute(`/events/${event.id}`);

      await user.click(await screen.findByRole('button', { name: 'Seat A7, Available' }));
      expect(screen.getByText('Selected seat: A7')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Seat A7, Selected' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await user.click(screen.getByRole('button', { name: 'Seat B2, Available' }));
      expect(screen.getByText('Selected seat: B2')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Seat B2, Selected' }));
      expect(screen.getByText('Select an available seat.')).toBeInTheDocument();
    });

    it('does not let the user select seats that are not available', async () => {
      signInAs('USER');
      const event = seedEvent({}, makeSeats(20, { A1: 'SOLD' }));
      renderRoute(`/events/${event.id}`);

      await screen.findByText('19 of 20 seats available');
      expect(screen.getByRole('img', { name: 'Seat A1, Sold' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Seat A1,/ })).not.toBeInTheDocument();
    });

    it.each([
      ['an ADMIN', 'ADMIN' as const, {}],
      ['a cancelled event', 'USER' as const, { status: 'CANCELLED' }],
    ])('does not allow selection for %s', async (_case, role, overrides) => {
      signInAs(role);
      const event = seedEvent(overrides);
      renderRoute(`/events/${event.id}`);

      await screen.findByText(/seats available/);
      expect(screen.queryByRole('button', { name: /^Seat / })).not.toBeInTheDocument();
      expect(screen.queryByText('Select an available seat.')).not.toBeInTheDocument();
    });

    it('keeps the selection when coming back to the event', async () => {
      signInAs('USER');
      const event = seedEvent();
      const { user } = renderRoute(`/events/${event.id}`);
      await user.click(await screen.findByRole('button', { name: 'Seat B7, Available' }));

      await user.click(screen.getByRole('link', { name: 'Back to events' }));
      await user.click(await screen.findByRole('link', { name: /Rock Night/ }));

      expect(await screen.findByText('Selected seat: B7')).toBeInTheDocument();
    });

    it('drops the selection when the seat is no longer available', async () => {
      signInAs('USER');
      const event = seedEvent();
      const { user } = renderRoute(`/events/${event.id}`);
      await user.click(await screen.findByRole('button', { name: 'Seat A3, Available' }));

      setSeats(event.id, makeSeats(20, { A3: 'RESERVED' }));
      await user.click(screen.getByRole('button', { name: 'Refresh' }));

      expect(await screen.findByText('A3 was just taken. Pick another seat')).toBeInTheDocument();
      expect(useSeatSelectionStore.getState().seatLabel).toBeNull();
      // El foco vuelve al mapa para elegir otro seat
      await waitFor(() =>
        expect(document.activeElement).toHaveAccessibleName('Seat A1, Available'),
      );
    });
  });
});
