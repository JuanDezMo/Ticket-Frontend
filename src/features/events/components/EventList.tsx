import { getErrorMessage } from '@/shared/api/error-messages';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusMessage } from '@/shared/ui/status-message';
import { EVENTS_PAGE_SIZE } from '../constants';
import type { Event } from '../types';
import { EventCard } from './EventCard';

interface EventListProps {
  events: Event[] | undefined;
  isLoading: boolean;
  error: unknown;
  page: number;
  onRetry: () => void;
  onFirstPage: () => void;
}

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

export function EventList({
  events,
  isLoading,
  error,
  page,
  onRetry,
  onFirstPage,
}: EventListProps) {
  if (isLoading) {
    return (
      <div className={GRID} aria-label="Loading events">
        {Array.from({ length: EVENTS_PAGE_SIZE / 2 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <StatusMessage
        title={getErrorMessage(error)}
        action={<Button onClick={onRetry}>Try again</Button>}
      />
    );
  }

  if (!events || events.length === 0) {
    return (
      <StatusMessage
        title="No events found"
        action={
          page > 1 ? (
            <Button variant="outline" onClick={onFirstPage}>
              Go to first page
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul className={GRID}>
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}
