import { useLocation } from 'react-router';
import { EventFilters } from '../components/EventFilters';
import { EventList } from '../components/EventList';
import { Pagination } from '../components/Pagination';
import { useEventFilters, useEvents } from '../hooks';

const FIRST_PAGE = 1;

export function EventsPage() {
  const location = useLocation();
  const { filters, page, setFilter, setPage, clear } = useEventFilters();
  const events = useEvents(filters, page);
  const meta = events.data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <EventFilters
        filters={filters}
        onChange={setFilter}
        onSearch={(value) => setFilter('search', value)}
        onClear={clear}
      />
      <EventList
        events={events.data?.data}
        isLoading={events.isLoading}
        error={events.error}
        page={page}
        listSearch={location.search}
        onRetry={() => void events.refetch()}
        onFirstPage={() => setPage(FIRST_PAGE)}
      />
      {meta && meta.total > 0 && (
        <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
