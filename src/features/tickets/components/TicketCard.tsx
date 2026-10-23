import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { formatDateTime } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Laminate } from '@/shared/ui/laminate';
import { TICKET_STATUSES, type MyTicket } from '../types';

/** Un ticket pagado: seat en letra de bloque y los datos del evento. Todo el pase abre el evento. */
export function TicketCard({ ticket }: { ticket: MyTicket }) {
  const cancelled = ticket.status === TICKET_STATUSES.CANCELLED_BY_EVENT;

  return (
    // Atenuado con color de texto apagado, no con opacidad: se conserva el contraste
    <Laminate className={cn('grid grid-cols-[5rem_1fr] p-0', cancelled && 'bg-muted shadow-none')}>
      <div className="flex flex-col items-center justify-center gap-1 border-r border-dashed px-2 py-4">
        <span className="text-muted-foreground text-xs">Seat</span>
        <span className={cn('display text-code-lg', cancelled && 'text-muted-foreground')}>
          {ticket.seat}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 p-4">
        <h2
          className={cn(
            'text-base leading-snug font-semibold',
            cancelled && 'text-muted-foreground',
          )}
        >
          <Link
            to={ROUTES.eventDetail(ticket.event.id)}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {ticket.event.name}
          </Link>
        </h2>
        <p className="text-muted-foreground text-sm">
          {ticket.event.venue} · {formatDateTime(ticket.event.startDate)}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="display text-code-md">{formatMoney(ticket.amount)}</span>
          {cancelled && <Badge variant="destructive">Cancelled by organizer</Badge>}
        </div>
        <p className="text-muted-foreground text-xs">Issued {formatDateTime(ticket.issuedAt)}</p>
      </div>
    </Laminate>
  );
}
