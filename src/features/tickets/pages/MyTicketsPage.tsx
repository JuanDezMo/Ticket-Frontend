import { Link } from 'react-router';
import { getErrorMessage } from '@/shared/api/error-messages';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/ui/pagination';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusMessage } from '@/shared/ui/status-message';
import { TicketCard } from '../components/TicketCard';
import { MY_TICKETS_PAGE_SIZE, useMyTickets, useTicketsPage } from '../hooks';

const GRID = 'grid gap-4 sm:grid-cols-2';

export function MyTicketsPage() {
  const { page, setPage } = useTicketsPage();
  const tickets = useMyTickets(page);
  const { data, error, isLoading } = tickets;

  const heading = <h1 className="display text-code-lg">My tickets</h1>;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        <div className={GRID} aria-label="Loading tickets">
          {Array.from({ length: MY_TICKETS_PAGE_SIZE / 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <StatusMessage
        title={getErrorMessage(error)}
        action={<Button onClick={() => void tickets.refetch()}>Try again</Button>}
      />
    );
  }

  if (data.data.length === 0) {
    return (
      <StatusMessage
        title="You have no tickets yet"
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.home}>Browse events</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {heading}
      <ul className={GRID}>
        {data.data.map((ticket) => (
          <li key={ticket.id}>
            <TicketCard ticket={ticket} />
          </li>
        ))}
      </ul>
      {data.meta.totalPages > 1 && (
        <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
