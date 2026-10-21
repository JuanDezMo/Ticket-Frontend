import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { makeEvent } from '@/test/fixtures/events';
import { EventCard } from './EventCard';
import { EventFilters } from './EventFilters';
import { EventList } from './EventList';
import { Pagination } from './Pagination';

describe('EventCard', () => {
  it('links to the detail and marks cancelled events', () => {
    const event = makeEvent({ name: 'Rock Night', status: 'CANCELLED', price: 150 });
    render(
      <MemoryRouter>
        <EventCard event={event} listSearch="" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', `/events/${event.id}`);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('Concert')).toBeInTheDocument();
  });
});

describe('EventFilters', () => {
  const noop = () => {};

  it('searches once after the user stops typing', async () => {
    const onSearch = vi.fn();
    render(<EventFilters filters={{}} onChange={noop} onSearch={onSearch} onClear={noop} />);

    await userEvent.type(screen.getByLabelText('Search'), 'rock');

    await vi.waitFor(() => expect(onSearch).toHaveBeenCalledWith('rock'));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('shows an error for an inverted date range', () => {
    render(
      <EventFilters
        filters={{ from: '2026-12-31', to: '2026-12-01' }}
        onChange={noop}
        onSearch={noop}
        onClear={noop}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent("'From' must be before 'To'");
  });

  it('sends the selected type', async () => {
    const onChange = vi.fn();
    render(<EventFilters filters={{}} onChange={onChange} onSearch={noop} onClear={noop} />);

    await userEvent.selectOptions(screen.getByLabelText('Type'), 'Concert');

    expect(onChange).toHaveBeenCalledWith('type', 'CONCERT');
  });
});

describe('Pagination', () => {
  it('disables Previous on the first page and Next on the last one', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    rerender(<Pagination page={3} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});

describe('EventList', () => {
  const props = {
    events: undefined,
    isLoading: false,
    error: null,
    page: 1,
    listSearch: '',
    onRetry: () => {},
    onFirstPage: () => {},
  };

  it('shows the loading state', () => {
    render(<EventList {...props} isLoading />);
    expect(screen.getByLabelText('Loading events')).toBeInTheDocument();
  });

  it('shows the empty state, with a link to page 1 past the first page', () => {
    const { rerender } = render(<EventList {...props} events={[]} />);
    expect(screen.getByText('No events found')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go to first page' })).not.toBeInTheDocument();

    rerender(<EventList {...props} events={[]} page={4} />);
    expect(screen.getByRole('button', { name: 'Go to first page' })).toBeInTheDocument();
  });

  it('shows the error with a retry button', async () => {
    const onRetry = vi.fn();
    render(<EventList {...props} error={new Error('boom')} onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Something went wrong. Please try again')).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalled();
  });
});
