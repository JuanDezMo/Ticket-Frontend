import { ArrowLeftIcon } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { SeatMap, SeatsLeft, SignInToSeeSeats } from '@/features/seats';
import { ApiError, ERROR_CODES } from '@/shared/api/api-error';
import { getErrorMessage } from '@/shared/api/error-messages';
import { ROUTES } from '@/shared/config/routes';
import { formatDateTime } from '@/shared/lib/format-date';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusMessage } from '@/shared/ui/status-message';
import { EventDetails } from '../components/EventDetails';
import { getEventNotice } from '../event-notice';
import { useBackToEventsPath, useEvent } from '../hooks';
import { isEventId } from '../schemas';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.code === ERROR_CODES.EVENT_NOT_FOUND;
}

export function EventDetailPage() {
  const { id } = useParams();
  const role = useSessionStore((state) => state.role);
  const eventQuery = useEvent(id);
  const backTo = useBackToEventsPath();

  const backLink = (
    <Button asChild variant="ghost" className="-ml-3 self-start">
      <Link to={backTo}>
        <ArrowLeftIcon aria-hidden="true" />
        Back to events
      </Link>
    </Button>
  );

  if (!isEventId(id) || isNotFound(eventQuery.error)) {
    return <StatusMessage title="Event not found" action={backLink} />;
  }

  if (eventQuery.isLoading) {
    return <Skeleton aria-label="Loading event" className="h-64 rounded-xl" />;
  }

  if (eventQuery.error || !eventQuery.data) {
    return (
      <StatusMessage
        title={getErrorMessage(eventQuery.error)}
        action={<Button onClick={() => void eventQuery.refetch()}>Try again</Button>}
      />
    );
  }

  const event = eventQuery.data;
  const notice = getEventNotice(event, new Date());

  return (
    <div className="flex flex-col gap-6">
      {backLink}
      <EventDetails
        event={event}
        notice={notice}
        seatsLeft={
          role ? <SeatsLeft eventId={event.id} fallback={`${event.capacity} seats`} /> : undefined
        }
      />
      {role ? (
        <SeatMap
          eventId={event.id}
          eventBookable={notice === null}
          price={event.price}
          maxSeatsPerUser={event.maxSeatsPerUser}
          eventLine={`${event.name} · ${formatDateTime(event.startDate)}`}
          onEventNotActive={() => void eventQuery.refetch()}
        />
      ) : (
        <SignInToSeeSeats returnTo={ROUTES.eventDetail(event.id)} />
      )}
    </div>
  );
}
