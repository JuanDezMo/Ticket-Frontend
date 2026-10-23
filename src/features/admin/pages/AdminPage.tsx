import { Link } from 'react-router';
import { useEventFilters, useEvents } from '@/features/events';
import { getErrorMessage } from '@/shared/api/error-messages';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/ui/pagination';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusMessage } from '@/shared/ui/status-message';
import { AdminEventRow } from '../components/AdminEventRow';

const NO_FILTERS = {};

export function AdminPage() {
  const { page, setPage } = useEventFilters();
  const events = useEvents(NO_FILTERS, page);
  const { data, error, isLoading } = events;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-code-lg">Admin</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={ROUTES.adminNewEvent}>Create event</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.adminNewUser}>Create user</Link>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div aria-label="Loading events" className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : error || !data ? (
        <StatusMessage
          title={getErrorMessage(error)}
          action={<Button onClick={() => void events.refetch()}>Try again</Button>}
        />
      ) : data.data.length === 0 ? (
        <StatusMessage title="No events yet" />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.data.map((event) => (
              <li key={event.id}>
                <AdminEventRow event={event} />
              </li>
            ))}
          </ul>
          {data.meta.totalPages > 1 && (
            <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
