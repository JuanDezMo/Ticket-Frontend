import type { ReactNode } from 'react';
import { formatDateParts, formatDateRange } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { Laminate } from '@/shared/ui/laminate';
import { EVENT_TYPE_LABELS } from '../constants';
import { EVENT_NOTICE_MESSAGES, type EventNotice } from '../event-notice';
import type { Event } from '../types';
import { EventStatusBadge } from './EventStatusBadge';

interface EventDetailsProps {
  event: Event;
  notice: EventNotice | null;
  // Con sesión, cuántos seats quedan; sin ella se muestra el total del evento
  seatsLeft?: ReactNode;
}

/** Cabecera del evento como pase: franja de nivel, fecha en bloque y datos en pares. */
export function EventDetails({ event, notice, seatsLeft }: EventDetailsProps) {
  const { month, day } = formatDateParts(event.startDate);

  return (
    <article className="flex flex-col gap-4">
      <Laminate tier punched>
        <div className="grid grid-cols-[auto_1fr] items-end gap-x-4 gap-y-1 px-4 pt-8 pb-4 sm:px-6">
          <time dateTime={event.startDate} className="row-span-2 flex flex-col self-center">
            <span className="display text-code-sm text-muted-foreground">{month}</span>
            <span className="display text-code-lg">{day}</span>
          </time>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl leading-tight font-semibold">{event.name}</h1>
            <EventStatusBadge notice={notice} />
          </div>
          <p className="text-muted-foreground text-sm">
            {EVENT_TYPE_LABELS[event.type]} · {formatDateRange(event.startDate, event.endDate)}
          </p>
          <dl className="col-span-2 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-dashed pt-3 text-sm sm:flex sm:flex-wrap sm:gap-x-6">
            <div className="contents sm:flex sm:gap-1.5">
              <dt className="text-muted-foreground">Venue</dt>
              <dd className="font-semibold">{event.venue}</dd>
            </div>
            <div className="contents sm:flex sm:gap-1.5">
              <dt className="text-muted-foreground">Price</dt>
              <dd className="display text-code-md">{formatMoney(event.price)}</dd>
            </div>
            <div className="contents sm:flex sm:gap-1.5">
              <dt className="text-muted-foreground">Seats</dt>
              <dd className="font-semibold">{seatsLeft ?? `${event.capacity} seats`}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground col-span-2 mt-2 max-w-prose text-sm">
            {event.description}
          </p>
        </div>
      </Laminate>
      {notice && (
        <p
          role="status"
          className="border-input bg-muted rounded-lg border px-4 py-3 text-sm font-semibold"
        >
          {EVENT_NOTICE_MESSAGES[notice]}
        </p>
      )}
    </article>
  );
}
