import { EventFilters } from '../components/EventFilters';
import { EventList } from '../components/EventList';
import { Pagination } from '../components/Pagination';
import { useEventFilters, useEvents, useRememberListSearch } from '../hooks';

const FIRST_PAGE = 1;

export function EventsPage() {
  useRememberListSearch();
  const { filters, page, setFilter, setPage, clear } = useEventFilters();
  const events = useEvents(filters, page);
  const meta = events.data?.meta;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-code-lg">Events</h1>
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
        onRetry={() => void events.refetch()}
        onFirstPage={() => setPage(FIRST_PAGE)}
      />
      {/* Con una sola página no hace falta paginar */}
      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
