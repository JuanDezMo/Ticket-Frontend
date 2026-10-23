import { Link } from 'react-router';
import { useBackToEventsPath } from '@/features/events';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button';
import { StatusMessage } from '@/shared/ui/status-message';
import { ENDED_KINDS, type EndedKind } from '../checkout-views';

interface EndedViewProps {
  kind: EndedKind;
  // Para volver al evento de la reserva; sin él ("Reservation not found") se vuelve al listado
  eventId?: string;
}

const ENDED_TITLES: Record<EndedKind, string> = {
  [ENDED_KINDS.EXPIRED]: 'This reservation has expired',
  [ENDED_KINDS.CANCELLED]: 'This reservation was cancelled',
  [ENDED_KINDS.EVENT_CANCELLED]: 'This event has been cancelled',
  [ENDED_KINDS.PAID]: 'This reservation is already paid',
  [ENDED_KINDS.NOT_FOUND]: 'Reservation not found',
};

/** Mensaje y siguiente paso cuando la reserva ya no se puede pagar. */
export function EndedView({ kind, eventId }: EndedViewProps) {
  const eventsPath = useBackToEventsPath();

  const action = {
    [ENDED_KINDS.EXPIRED]: eventId
      ? { label: 'Back to event', to: ROUTES.eventDetail(eventId) }
      : { label: 'Back to events', to: eventsPath },
    [ENDED_KINDS.CANCELLED]: eventId
      ? { label: 'Back to event', to: ROUTES.eventDetail(eventId) }
      : { label: 'Back to events', to: eventsPath },
    [ENDED_KINDS.EVENT_CANCELLED]: { label: 'Back to events', to: eventsPath },
    [ENDED_KINDS.PAID]: { label: 'View my tickets', to: ROUTES.myTickets },
    [ENDED_KINDS.NOT_FOUND]: { label: 'Back to events', to: eventsPath },
  }[kind];

  return (
    <StatusMessage
      title={ENDED_TITLES[kind]}
      action={
        <Button asChild variant="outline">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      }
    />
  );
}
