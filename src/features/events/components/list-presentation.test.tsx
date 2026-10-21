import { screen, waitFor, within } from '@testing-library/react';
import { daysFromNow, makeEvent } from '@/test/fixtures/events';
import { setMedia } from '@/test/media';
import { setEvents } from '@/test/msw/event-handlers';
import { renderRoute } from '@/test/render';

async function cards() {
  return within(await screen.findByRole('list')).getAllByRole('link');
}

describe('events list on mobile', () => {
  beforeEach(() => setMedia({ wide: false }));

  it('keeps search visible and folds the rest into a Filters panel with a count', async () => {
    setEvents([makeEvent({ name: 'Rock Night', type: 'CONCERT' })]);
    renderRoute('/?type=CONCERT&status=ACTIVE');

    expect(await screen.findByRole('button', { name: 'Filters (2)' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
  });

  it('filters from the panel and closes it with Escape', async () => {
    setEvents([
      makeEvent({ name: 'Rock Night', type: 'CONCERT' }),
      makeEvent({ name: 'Tech Meetup', type: 'MEETUP' }),
    ]);
    const { user, router } = renderRoute('/');
    await screen.findByRole('heading', { name: 'Tech Meetup' });

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const panel = await screen.findByRole('dialog', { name: 'Filters' });
    await user.selectOptions(within(panel).getByLabelText('Type'), 'Concert');

    expect(router.state.location.search).toBe('?type=CONCERT');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Filters (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Tech Meetup' })).not.toBeInTheDocument();
  });
});

describe('event card', () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'UTC';
  });
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('leads with the date and still links to the detail', async () => {
    const event = makeEvent({ name: 'Rock Night', startDate: '2099-11-10T15:00:00Z' });
    setEvents([event]);
    renderRoute('/');

    const [card] = await cards();
    expect(card).toHaveAttribute('href', `/events/${event.id}`);
    const date = card!.querySelector('time');
    expect(date).toHaveTextContent('Nov10');
    expect(date).toHaveTextContent('3:00 PM');
  });

  it('marks started events and keeps cancelled ones labelled', async () => {
    setEvents([
      makeEvent({ name: 'Late Jazz', startDate: daysFromNow(0, -1), endDate: daysFromNow(0, 2) }),
      makeEvent({ name: 'Tech Meetup', status: 'CANCELLED' }),
    ]);
    renderRoute('/');

    const [started, cancelled] = await cards();
    expect(within(started!).getByText('Started')).toBeInTheDocument();
    expect(within(cancelled!).getByText('Cancelled')).toBeInTheDocument();
  });
});

describe('pagination', () => {
  it('is hidden when everything fits in one page', async () => {
    setEvents(Array.from({ length: 5 }, () => makeEvent()));
    renderRoute('/');

    await cards();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });
});
