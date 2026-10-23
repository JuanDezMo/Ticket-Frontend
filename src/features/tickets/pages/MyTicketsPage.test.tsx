import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { ROUTES } from '@/shared/config/routes';
import { makeTicket } from '@/test/fixtures/reservations';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { setTickets } from '@/test/msw/purchase-handlers';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

function ticketFor(name: string, seat: string, overrides = {}) {
  const base = makeTicket({ seat, ...overrides });
  return { ...base, event: { ...base.event, name } };
}

describe('MyTicketsPage', () => {
  beforeEach(() => signInAs('USER'));

  it('lists the tickets with seat, event, venue and amount', async () => {
    setTickets([ticketFor('Rock Night', 'C7'), ticketFor('Jazz Evening', 'A1')]);
    renderRoute(ROUTES.myTickets);

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    const first = within(items[0] as HTMLElement);
    expect(first.getByText('C7')).toBeInTheDocument();
    expect(first.getByText('Rock Night')).toBeInTheDocument();
    expect(first.getByText(/Main Hall/)).toBeInTheDocument();
    expect(first.getByText('$49.99')).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText('Jazz Evening')).toBeInTheDocument();
  });

  it('opens the event of a ticket', async () => {
    const ticket = ticketFor('Rock Night', 'C7');
    setTickets([ticket]);
    renderRoute(ROUTES.myTickets);

    expect(await screen.findByRole('link', { name: 'Rock Night' })).toHaveAttribute(
      'href',
      ROUTES.eventDetail(ticket.event.id),
    );
  });

  it('marks tickets of cancelled events', async () => {
    setTickets([ticketFor('Rock Night', 'C7', { status: 'CANCELLED_BY_EVENT' })]);
    renderRoute(ROUTES.myTickets);

    expect(await screen.findByText('Cancelled by organizer')).toBeInTheDocument();
  });

  it('paginates with the page in the URL', async () => {
    setTickets(Array.from({ length: 30 }, (_, index) => ticketFor(`Event ${index + 1}`, 'A1')));
    const { user, router } = renderRoute(ROUTES.myTickets);

    await screen.findByText('Page 1 of 3');
    expect(await screen.findAllByRole('listitem')).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
    expect(await screen.findByRole('link', { name: 'Event 13' })).toBeInTheDocument();
  });

  it('hides the pagination with a single page', async () => {
    setTickets([ticketFor('Rock Night', 'C7')]);
    renderRoute(ROUTES.myTickets);

    await screen.findByText('Rock Night');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('invites to browse events when there are no tickets', async () => {
    renderRoute(ROUTES.myTickets);

    expect(await screen.findByText('You have no tickets yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse events' })).toHaveAttribute('href', '/');
  });

  it('shows the error and retries', async () => {
    let fail = true;
    server.use(
      http.get(apiPath('/tickets/me'), () =>
        fail
          ? HttpResponse.json(errorBody('INTERNAL_ERROR'), { status: 400 })
          : HttpResponse.json({
              data: [ticketFor('Rock Night', 'C7')],
              meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
            }),
      ),
    );
    const { user } = renderRoute(ROUTES.myTickets);

    expect(await screen.findByText('Something went wrong. Please try again')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Rock Night')).toBeInTheDocument();
  });

  it('does not let an ADMIN in', async () => {
    signInAs('ADMIN');
    renderRoute(ROUTES.myTickets);

    expect(
      await screen.findByText('You do not have permission to view this page'),
    ).toBeInTheDocument();
  });
});
