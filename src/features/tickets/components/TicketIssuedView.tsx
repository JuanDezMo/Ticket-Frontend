import { Link } from 'react-router';
import { useBackToEventsPath, useEvent } from '@/features/events';
import { ROUTES } from '@/shared/config/routes';
import { formatDateTime } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';
import type { IssuedTicket } from '../types';

/** Confirmación de la compra: el seat en letra de bloque, el evento y el monto pagado. */
export function TicketIssuedView({ ticket }: { ticket: IssuedTicket }) {
  const event = useEvent(ticket.eventId).data;
  const eventsPath = useBackToEventsPath();

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">Ticket issued</h1>
      <Laminate tier punched>
        <div className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-2 px-4 pt-8 pb-4">
          <div>
            <span className="text-muted-foreground text-xs">Seat</span>
            <span className="display text-code-lg block">{ticket.seat}</span>
          </div>
          <span className="display text-code-md">{formatMoney(ticket.amount)}</span>
          {event && (
            <p className="col-span-2 border-t border-dashed pt-2 text-sm">
              <span className="font-semibold">{event.name}</span>
              <span className="text-muted-foreground"> · {formatDateTime(event.startDate)}</span>
            </p>
          )}
        </div>
      </Laminate>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to={ROUTES.myTickets}>View my tickets</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={eventsPath}>Back to events</Link>
        </Button>
      </div>
    </section>
  );
}
