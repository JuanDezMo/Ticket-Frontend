import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { FORBIDDEN_MESSAGE } from '@/shared/session/RequireRole';
import { ROUTES } from '@/shared/config/routes';
import { makeEvent } from '@/test/fixtures/events';
import { setAdminData } from '@/test/msw/admin-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

describe('AdminPage', () => {
  beforeEach(() => signInAs('ADMIN'));

  it('lists active and cancelled events with their data and status', async () => {
    setAdminData({
      events: [
        makeEvent({
          name: 'Rock Night',
          venue: 'Main Hall',
          price: 49.99,
          capacity: 25,
          maxSeatsPerUser: 4,
        }),
        makeEvent({ name: 'Jazz Evening', status: 'CANCELLED', price: 80, capacity: 100 }),
      ],
    });
    renderRoute(ROUTES.admin);

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    const rock = within(items[0] as HTMLElement);
    expect(rock.getByRole('link', { name: 'Rock Night' })).toBeInTheDocument();
    expect(rock.getByText('Active')).toBeInTheDocument();
    expect(rock.getByText(/Main Hall/)).toBeInTheDocument();
    expect(rock.getByText('$49.99')).toBeInTheDocument();
    expect(rock.getByText(/25 seats/)).toBeInTheDocument();
    expect(rock.getByText(/up to 4 per buyer/)).toBeInTheDocument();
    const jazz = within(items[1] as HTMLElement);
    expect(jazz.getByText('Cancelled')).toBeInTheDocument();
    expect(jazz.getByText(/100 seats/)).toBeInTheDocument();
  });

  it('links each event to its detail and offers the create screens', async () => {
    const event = makeEvent({ name: 'Rock Night' });
    setAdminData({ events: [event] });
    renderRoute(ROUTES.admin);

    expect(await screen.findByRole('link', { name: 'Rock Night' })).toHaveAttribute(
      'href',
      ROUTES.eventDetail(event.id),
    );
    expect(screen.getByRole('link', { name: 'Create event' })).toHaveAttribute(
      'href',
      ROUTES.adminNewEvent,
    );
    expect(screen.getByRole('link', { name: 'Create user' })).toHaveAttribute(
      'href',
      ROUTES.adminNewUser,
    );
  });

  it('paginates with the page in the URL', async () => {
    setAdminData({
      events: Array.from({ length: 30 }, (_, index) => makeEvent({ name: `Event ${index + 1}` })),
    });
    const { user, router } = renderRoute(ROUTES.admin);

    await screen.findByText('Page 1 of 3');
    expect(await screen.findAllByRole('listitem')).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
    expect(await screen.findByRole('link', { name: 'Event 13' })).toBeInTheDocument();
  });

  it('hides the pagination with a single page', async () => {
    setAdminData({ events: [makeEvent({ name: 'Rock Night' })] });
    renderRoute(ROUTES.admin);

    await screen.findByText('Rock Night');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('says there are no events and still offers to create one', async () => {
    renderRoute(ROUTES.admin);

    expect(await screen.findByText('No events yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create event' })).toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    let fail = true;
    setAdminData({ events: [makeEvent({ name: 'Rock Night' })] });
    server.use(
      http.get(apiPath('/events'), () =>
        fail
          ? HttpResponse.json(errorBody('INTERNAL_ERROR'), { status: 400 })
          : HttpResponse.json({
              data: [makeEvent({ name: 'Rock Night' })],
              meta: { page: 1, pageSize: 12, total: 1, totalPages: 1 },
            }),
      ),
    );
    const { user } = renderRoute(ROUTES.admin);

    expect(await screen.findByText('Something went wrong. Please try again')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Rock Night')).toBeInTheDocument();
  });

  it('shows the forbidden page to a USER', async () => {
    signInAs('USER');
    renderRoute(ROUTES.admin);
    expect(await screen.findByText(FORBIDDEN_MESSAGE)).toBeInTheDocument();
  });
});
