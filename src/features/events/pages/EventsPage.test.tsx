import { screen, waitFor, within } from '@testing-library/react';
import { makeEvent } from '@/test/fixtures/events';
import { eventListRequests, setEvents } from '@/test/msw/event-handlers';
import { renderRoute } from '@/test/render';

const lastQuery = () => eventListRequests.at(-1)?.searchParams;

async function eventNames() {
  const list = await screen.findByRole('list');
  return within(list)
    .getAllByRole('heading')
    .map((heading) => heading.textContent);
}

describe('EventsPage', () => {
  it('shows events to a guest', async () => {
    setEvents([makeEvent({ name: 'Rock Night' }), makeEvent({ name: 'Tech Meetup' })]);
    renderRoute('/');

    expect(await eventNames()).toEqual(['Rock Night', 'Tech Meetup']);
  });

  it('moves to the next page and stores it in the URL', async () => {
    setEvents(Array.from({ length: 30 }, (_, index) => makeEvent({ name: `Event #${index + 1}` })));
    const { user, router } = renderRoute('/');
    await screen.findByText('Page 1 of 3');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
    expect((await eventNames())[0]).toBe('Event #13');
  });

  it('filters by type and goes back to page 1', async () => {
    setEvents([
      makeEvent({ name: 'Rock Night', type: 'CONCERT' }),
      makeEvent({ name: 'Tech Meetup', type: 'MEETUP' }),
    ]);
    const { user, router } = renderRoute('/?page=2');
    await screen.findByText('No events found');

    await user.selectOptions(screen.getByLabelText('Type'), 'Concert');

    expect(await eventNames()).toEqual(['Rock Night']);
    expect(router.state.location.search).toBe('?type=CONCERT');
    expect(lastQuery()?.get('type')).toBe('CONCERT');
    expect(lastQuery()?.get('page')).toBe('1');
  });

  it('reads the filters from a shared link', async () => {
    setEvents([
      makeEvent({ name: 'Old Meetup', type: 'MEETUP', status: 'CANCELLED' }),
      makeEvent({ name: 'New Meetup', type: 'MEETUP' }),
    ]);
    renderRoute('/?type=MEETUP&status=ACTIVE');

    expect(await eventNames()).toEqual(['New Meetup']);
    expect(screen.getByLabelText('Type')).toHaveValue('MEETUP');
    expect(screen.getByLabelText('Status')).toHaveValue('ACTIVE');
  });

  it('ignores invalid values in the URL', async () => {
    setEvents([makeEvent({ name: 'Rock Night' })]);
    renderRoute('/?type=FESTIVAL&page=abc');

    expect(await eventNames()).toEqual(['Rock Night']);
    expect(lastQuery()?.has('type')).toBe(false);
    expect(lastQuery()?.get('page')).toBe('1');
  });

  it('restores the previous filter when going back', async () => {
    setEvents([
      makeEvent({ name: 'Rock Night', type: 'CONCERT' }),
      makeEvent({ name: 'Tech Meetup', type: 'MEETUP' }),
    ]);
    const { user, router } = renderRoute('/');
    await eventNames();

    await user.selectOptions(screen.getByLabelText('Type'), 'Concert');
    await user.selectOptions(screen.getByLabelText('Type'), 'Meetup');
    expect(await eventNames()).toEqual(['Tech Meetup']);

    await router.navigate(-1);

    await waitFor(() => expect(screen.getByLabelText('Type')).toHaveValue('CONCERT'));
    expect(await eventNames()).toEqual(['Rock Night']);
  });

  it('searches by name with a single request', async () => {
    setEvents([makeEvent({ name: 'Rock Night' }), makeEvent({ name: 'Tech Meetup' })]);
    const { user } = renderRoute('/');
    await eventNames();
    const before = eventListRequests.length;

    await user.type(screen.getByLabelText('Search'), 'rock');

    await waitFor(() => expect(lastQuery()?.get('search')).toBe('rock'));
    expect(await eventNames()).toEqual(['Rock Night']);
    expect(eventListRequests.length - before).toBe(1);
  });

  it('clears every filter', async () => {
    setEvents([makeEvent({ name: 'Rock Night', type: 'CONCERT' })]);
    const { user, router } = renderRoute('/?type=MEETUP&search=x');
    await screen.findByText('No events found');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await eventNames()).toEqual(['Rock Night']);
    expect(router.state.location.search).toBe('');
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });

  it('does not query with an inverted date range', async () => {
    renderRoute('/?from=2026-12-31&to=2026-12-01');

    expect(await screen.findByRole('alert')).toHaveTextContent("'From' must be before 'To'");
    expect(eventListRequests).toHaveLength(0);
  });
});
