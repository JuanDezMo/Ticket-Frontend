import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { formatDateParts } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { cn } from '@/shared/lib/utils';
import { Laminate } from '@/shared/ui/laminate';
import { EVENT_TYPE_LABELS } from '../constants';
import { getEventNotice } from '../event-notice';
import type { Event } from '../types';
import { EventStatusBadge } from './EventStatusBadge';

export function EventCard({ event }: { event: Event }) {
  const { month, day, time, year } = formatDateParts(event.startDate);
  const notice = getEventNotice(event, new Date());

  return (
    <Link to={ROUTES.eventDetail(event.id)} className="group block rounded-lg">
      {/* Cancelados e iniciados se atenúan sin bajar el texto de AA */}
      <Laminate
        className={cn(
          'grid h-full grid-cols-[4.75rem_1fr] transition-colors duration-[90ms] ease-[steps(2,end)] group-hover:border-input motion-reduce:transition-none',
          notice && 'shadow-none',
        )}
      >
        <time
          dateTime={event.startDate}
          className="flex flex-col items-center justify-center gap-1 border-r border-dashed px-1.5 py-4"
        >
          <span className="display text-code-sm text-muted-foreground">{month}</span>
          <span className={cn('display text-code-lg', notice && 'line-through decoration-2')}>
            {day}
          </span>
          <span className="text-muted-foreground text-xs">{time}</span>
          {year && <span className="text-muted-foreground text-xs">{year}</span>}
        </time>
        <div className="flex min-w-0 flex-col gap-0.5 p-4">
          <h2
            className={cn(
              'text-base leading-snug font-semibold',
              notice && 'text-muted-foreground',
            )}
          >
            {event.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            <span>{EVENT_TYPE_LABELS[event.type]}</span> · <span>{event.venue}</span>
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={cn('display text-code-md', notice && 'text-muted-foreground')}>
              {formatMoney(event.price)}
            </span>
            <EventStatusBadge notice={notice} />
          </div>
        </div>
      </Laminate>
    </Link>
  );
}
