import { formatDateRange } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { EVENT_TYPE_LABELS } from '../constants';
import { EVENT_NOTICE_MESSAGES, type EventNotice } from '../event-notice';
import type { Event } from '../types';
import { EventStatusBadge } from './EventStatusBadge';

interface EventDetailsProps {
  event: Event;
  notice: EventNotice | null;
}

export function EventDetails({ event, notice }: EventDetailsProps) {
  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <p className="text-muted-foreground">{EVENT_TYPE_LABELS[event.type]}</p>
      </header>
      {notice && (
        <p role="status" className="bg-muted rounded-lg px-3 py-2 text-sm font-medium">
          {EVENT_NOTICE_MESSAGES[notice]}
        </p>
      )}
      <p>{event.description}</p>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Venue</dt>
        <dd>{event.venue}</dd>
        <dt className="text-muted-foreground">When</dt>
        <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
        <dt className="text-muted-foreground">Price</dt>
        <dd>{formatMoney(event.price)}</dd>
        <dt className="text-muted-foreground">Capacity</dt>
        <dd>{event.capacity} seats</dd>
      </dl>
    </article>
  );
}
