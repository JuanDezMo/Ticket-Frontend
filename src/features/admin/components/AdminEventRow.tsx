import { Link } from 'react-router';
import { EVENT_STATUS_LABELS, EVENT_STATUSES, type Event } from '@/features/events';
import { ROUTES } from '@/shared/config/routes';
import { formatDateTime } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { Badge } from '@/shared/ui/badge';
import { Laminate } from '@/shared/ui/laminate';
import { canCancelEvent } from '../can-cancel-event';
import { CancelEvent } from './CancelEvent';

/** Una fila del panel: datos del evento a la izquierda y su acción a la derecha. */
export function AdminEventRow({ event }: { event: Event }) {
  const cancelled = event.status === EVENT_STATUSES.CANCELLED;

  return (
    <Laminate className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base leading-snug font-semibold">
            <Link to={ROUTES.eventDetail(event.id)} className="underline-offset-4 hover:underline">
              {event.name}
            </Link>
          </h2>
          <Badge variant={cancelled ? 'destructive' : 'outline'}>
            {EVENT_STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {formatDateTime(event.startDate)} · {event.venue}
        </p>
        <p className="text-sm">
          <span className="display text-code-md">{formatMoney(event.price)}</span>
          <span className="text-muted-foreground"> · {event.capacity} seats</span>
        </p>
      </div>
      {canCancelEvent(event, new Date()) && <CancelEvent event={event} />}
    </Laminate>
  );
}
