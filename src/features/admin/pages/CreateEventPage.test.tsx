import { fireEvent, screen, waitFor } from '@testing-library/react';
import { addMonths, format } from 'date-fns';
import { delay, http, HttpResponse } from 'msw';
import { FORBIDDEN_MESSAGE } from '@/shared/session/RequireRole';
import { REDIRECT_PARAM, ROUTES } from '@/shared/config/routes';
import { useSessionStore } from '@/shared/session/session.store';
import { createEventRequests } from '@/test/msw/admin-handlers';
import { apiPath, errorBody } from '@/test/msw/handlers-shared';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

type User = ReturnType<typeof renderRoute>['user'];

// Un día del mes que viene: siempre es futuro
async function pickDay(user: User, label: 'Start' | 'End', day: number, time: string) {
  const nextMonth = addMonths(new Date(), 1);
  await user.click(screen.getByRole('button', { name: new RegExp(`^${label} date`) }));
  await user.click(await screen.findByRole('button', { name: /next month/i }));
  await user.click(
    await screen.findByRole('button', {
      name: new RegExp(
        `${format(nextMonth, 'MMMM')} ${day}(st|nd|rd|th), ${nextMonth.getFullYear()}`,
      ),
    }),
  );
  fireEvent.change(screen.getByLabelText(`${label} time`), { target: { value: time } });
}

async function fillEvent(user: User, capacity = '25') {
  await user.type(await screen.findByLabelText('Name'), '  Rock Night ');
  await user.type(screen.getByLabelText('Description'), 'Live music');
  await user.selectOptions(screen.getByLabelText('Type'), 'Concert');
  await user.type(screen.getByLabelText('Venue'), 'Main Hall');
  await user.type(screen.getByLabelText('Price (USD)'), '49.99');
  await user.type(screen.getByLabelText('Capacity'), capacity);
  await pickDay(user, 'Start', 15, '20:00');
  await pickDay(user, 'End', 15, '23:00');
}

const submit = () => screen.getByRole('button', { name: /^(Create event|Creating)/ });

describe('CreateEventPage', () => {
  beforeEach(() => signInAs('ADMIN'));

  it('shows an error next to each invalid field and sends nothing', async () => {
    const { user } = renderRoute(ROUTES.adminNewEvent);
    await user.type(await screen.findByLabelText('Price (USD)'), '0');
    await user.type(screen.getByLabelText('Capacity'), '300');

    await user.click(submit());

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Choose an event type')).toBeInTheDocument();
    expect(screen.getByText('Venue is required')).toBeInTheDocument();
    expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
    expect(screen.getByText('Capacity must be a whole number from 1 to 260')).toBeInTheDocument();
    expect(screen.getByText('Choose a start date')).toBeInTheDocument();
    expect(createEventRequests).toHaveLength(0);
  });

  it('shows the seat preview while the capacity is typed', async () => {
    const { user } = renderRoute(ROUTES.adminNewEvent);
    const capacity = await screen.findByLabelText('Capacity');
    expect(screen.queryByText(/seats in/)).not.toBeInTheDocument();

    await user.type(capacity, '25');
    expect(screen.getByText('25 seats in 3 rows')).toBeInTheDocument();

    await user.clear(capacity);
    await user.type(capacity, '260');
    expect(screen.getByText('260 seats in 26 rows')).toBeInTheDocument();

    await user.clear(capacity);
    await user.type(capacity, '300');
    expect(screen.queryByText(/seats in/)).not.toBeInTheDocument();
  });

  it('rejects an end before the start', async () => {
    const { user } = renderRoute(ROUTES.adminNewEvent);
    await fillEvent(user);
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '19:00' } });

    await user.click(submit());

    expect(await screen.findByText('End must be after start')).toBeInTheDocument();
    expect(createEventRequests).toHaveLength(0);
  });

  it('creates the event with UTC dates and opens its detail', async () => {
    const { user, router } = renderRoute(ROUTES.adminNewEvent);
    await fillEvent(user);

    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/events\//));
    expect(await screen.findByText('Event created')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument();
    expect(createEventRequests).toHaveLength(1);
    const request = createEventRequests[0];
    expect(request).toMatchObject({
      name: 'Rock Night',
      description: 'Live music',
      type: 'CONCERT',
      venue: 'Main Hall',
      price: 49.99,
      capacity: 25,
    });
    expect(request?.startDate).toMatch(/Z$/);
    expect(new Date(request?.endDate ?? '').getTime()).toBeGreaterThan(
      new Date(request?.startDate ?? '').getTime(),
    );
  });

  it('shows "Creating..." and sends one request on a double click', async () => {
    const requests = vi.fn();
    server.use(
      http.post(apiPath('/events'), async () => {
        requests();
        await delay(150);
        return HttpResponse.json(errorBody('VALIDATION_ERROR'), { status: 400 });
      }),
    );
    const { user } = renderRoute(ROUTES.adminNewEvent);
    await fillEvent(user);

    await user.dblClick(submit());

    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
    await screen.findByText(/Some fields are invalid/);
    expect(requests).toHaveBeenCalledTimes(1);
  });

  it('shows a server validation error and keeps what was typed', async () => {
    server.use(
      http.post(apiPath('/events'), () =>
        HttpResponse.json(errorBody('VALIDATION_ERROR'), { status: 400 }),
      ),
    );
    const { user } = renderRoute(ROUTES.adminNewEvent);
    await fillEvent(user);

    await user.click(submit());

    expect(await screen.findByText(/Some fields are invalid/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('  Rock Night ');
    expect(screen.getByLabelText('Capacity')).toHaveValue('25');
    expect(submit()).toBeEnabled();
  });
});

describe('create event access', () => {
  it('shows the forbidden page to a USER', async () => {
    signInAs('USER');
    renderRoute(ROUTES.adminNewEvent);
    expect(await screen.findByText(FORBIDDEN_MESSAGE)).toBeInTheDocument();
  });

  it('sends a visitor to the login and back', async () => {
    useSessionStore.getState().signOut();
    const { router } = renderRoute(ROUTES.adminNewEvent);

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.login));
    expect(new URLSearchParams(router.state.location.search).get(REDIRECT_PARAM)).toBe(
      ROUTES.adminNewEvent,
    );
  });
});
