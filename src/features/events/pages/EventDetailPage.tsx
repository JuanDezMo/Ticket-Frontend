import { ArrowLeftIcon } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';
import { SeatMap, SignInToSeeSeats } from '@/features/seats';
import { ApiError, ERROR_CODES } from '@/shared/api/api-error';
import { getErrorMessage } from '@/shared/api/error-messages';
import { ROUTES } from '@/shared/config/routes';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusMessage } from '@/shared/ui/status-message';
import { EventDetails } from '../components/EventDetails';
import { getEventNotice } from '../event-notice';
import { useEvent } from '../hooks';
import { isEventId } from '../schemas';

// El listado deja su query string en el state para volver con los mismos filtros
function readListSearch(state: unknown): string {
  if (state && typeof state === 'object' && 'listSearch' in state) {
    return typeof state.listSearch === 'string' ? state.listSearch : '';
  }
  return '';
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.code === ERROR_CODES.EVENT_NOT_FOUND;
}

export function EventDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const role = useSessionStore((state) => state.role);
  const eventQuery = useEvent(id);
  const backTo = `${ROUTES.home}${readListSearch(location.state)}`;

  const backLink = (
    <Button asChild variant="ghost" className="self-start">
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
      <EventDetails event={event} notice={notice} />
      {role ? (
        <SeatMap eventId={event.id} eventBookable={notice === null} />
      ) : (
        <SignInToSeeSeats returnTo={ROUTES.eventDetail(event.id)} />
      )}
    </div>
  );
}
