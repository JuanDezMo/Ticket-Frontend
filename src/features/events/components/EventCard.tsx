import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { formatDateTime } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { EVENT_TYPE_LABELS } from '../constants';
import type { Event } from '../types';
import { EventStatusBadge } from './EventStatusBadge';

interface EventCardProps {
  event: Event;
  // Query string del listado, para que "Back to events" conserve los filtros
  listSearch: string;
}

export function EventCard({ event, listSearch }: EventCardProps) {
  return (
    <Link
      to={ROUTES.eventDetail(event.id)}
      state={{ listSearch }}
      className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="hover:bg-muted/50 h-full transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>
              <h2>{event.name}</h2>
            </CardTitle>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-muted-foreground text-sm">{EVENT_TYPE_LABELS[event.type]}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <span>{event.venue}</span>
          <time dateTime={event.startDate}>{formatDateTime(event.startDate)}</time>
          <span className="font-medium">{formatMoney(event.price)}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
