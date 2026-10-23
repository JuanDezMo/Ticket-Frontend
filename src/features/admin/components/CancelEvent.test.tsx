import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { ROUTES } from '@/shared/config/routes';
import { makeEvent } from '@/test/fixtures/events';
import { cancelEventRequests, setAdminData } from '@/test/msw/admin-handlers';
import { eventListRequests } from '@/test/msw/event-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

type User = ReturnType<typeof renderRoute>['user'];

async function openDialog(user: User, name = 'Rock Night') {
  await user.click(await screen.findByRole('button', { name: `Cancel event ${name}` }));
  return screen.findByRole('alertdialog');
}

describe('CancelEvent', () => {
  beforeEach(() => signInAs('ADMIN'));

  it('explains what is lost, cancels on confirm and reports the counts', async () => {
    setAdminData({
      events: [makeEvent({ name: 'Rock Night' })],
      cancellation: { cancelledReservations: 4, cancelledTickets: 12 },
    });
    const { user } = renderRoute(ROUTES.admin);

    const dialog = await openDialog(user);
    expect(dialog).toHaveTextContent('All its reservations and tickets will be cancelled');
    expect(dialog).toHaveTextContent('This cannot be undone');
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel event' }));

    expect(
      await screen.findByText('Event cancelled: 4 reservations and 12 tickets cancelled'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Cancel event/ })).not.toBeInTheDocument();
  });

  it('uses the singular for one reservation and one ticket', async () => {
    setAdminData({
      events: [makeEvent({ name: 'Rock Night' })],
      cancellation: { cancelledReservations: 1, cancelledTickets: 1 },
    });
    const { user } = renderRoute(ROUTES.admin);

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel event' }));

    expect(
      await screen.findByText('Event cancelled: 1 reservation and 1 ticket cancelled'),
    ).toBeInTheDocument();
  });

  it('sends nothing when the dialog is dismissed', async () => {
    setAdminData({ events: [makeEvent({ name: 'Rock Night' })] });
    const { user } = renderRoute(ROUTES.admin);

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Keep event' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(cancelEventRequests).toHaveLength(0);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('sends one request on a double confirmation', async () => {
    setAdminData({ events: [makeEvent({ name: 'Rock Night' })] });
    const { user } = renderRoute(ROUTES.admin);

    const dialog = await openDialog(user);
    await user.dblClick(within(dialog).getByRole('button', { name: 'Yes, cancel event' }));

    await screen.findByText('Event cancelled: 0 reservations and 0 tickets cancelled');
    expect(cancelEventRequests).toHaveLength(1);
  });

  it('disables the button while the request is pending', async () => {
    setAdminData({ events: [makeEvent({ name: 'Rock Night' })] });
    server.use(
      http.post(apiPath('/events/:id/cancel'), async ({ params }) => {
        await delay(200);
        return HttpResponse.json({
          id: params.id,
          status: 'CANCELLED',
          cancelledReservations: 0,
          cancelledTickets: 0,
        });
      }),
    );
    const { user } = renderRoute(ROUTES.admin);

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel event' }));

    expect(screen.getByRole('button', { name: 'Cancel event Rock Night' })).toBeDisabled();
    await screen.findByText('Event cancelled: 0 reservations and 0 tickets cancelled');
  });

  it.each([
    ['EVENT_ALREADY_CANCELLED', 'This event is already cancelled'],
    ['EVENT_ALREADY_ENDED', 'This event has already ended'],
  ])('shows the message for %s and refreshes the list', async (code, message) => {
    setAdminData({ events: [makeEvent({ name: 'Rock Night' })] });
    server.use(
      http.post(apiPath('/events/:id/cancel'), () =>
        HttpResponse.json(errorBody(code), { status: 409 }),
      ),
    );
    const { user } = renderRoute(ROUTES.admin);
    await screen.findByText('Rock Night');
    const before = eventListRequests.length;

    const dialog = await openDialog(user);
    await user.click(within(dialog).getByRole('button', { name: 'Yes, cancel event' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    await waitFor(() => expect(eventListRequests.length).toBeGreaterThan(before));
  });

  it('does not offer to cancel a cancelled or an ended event', async () => {
    setAdminData({
      events: [
        makeEvent({ name: 'Cancelled one', status: 'CANCELLED' }),
        makeEvent({
          name: 'Ended one',
          startDate: '2020-01-01T10:00:00Z',
          endDate: '2020-01-01T12:00:00Z',
        }),
      ],
    });
    renderRoute(ROUTES.admin);

    await screen.findByText('Cancelled one');
    expect(screen.queryByRole('button', { name: /^Cancel event/ })).not.toBeInTheDocument();
  });
});
