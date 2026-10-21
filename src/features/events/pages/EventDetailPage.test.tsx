import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useSeatSelectionStore } from '@/features/seats/store';
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

    it('goes back to the list keeping the filters', async () => {
      seedEvent({ type: 'CONCERT' });
      const { user, router } = renderRoute('/?type=CONCERT');

      await user.click(await screen.findByRole('link', { name: /Rock Night/ }));
      await user.click(await screen.findByRole('link', { name: 'Back to events' }));

      expect(router.state.location.search).toBe('?type=CONCERT');
      expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
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

      expect(
        await screen.findByText('Your selected seat is no longer available'),
      ).toBeInTheDocument();
      expect(useSeatSelectionStore.getState().seatLabel).toBeNull();
    });
  });
});
