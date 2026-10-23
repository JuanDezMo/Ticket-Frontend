import { Link } from 'react-router';
import { useBackToEventsPath, useEvent } from '@/features/events';
import { ROUTES } from '@/shared/config/routes';
import { formatDateTime } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';
import type { PurchaseResult } from '../types';

/** Confirmación de la compra: cada seat en letra de bloque, el evento y el total pagado. */
export function TicketIssuedView({ result }: { result: PurchaseResult }) {
  const { tickets } = result;
  const several = tickets.length > 1;
  const event = useEvent(tickets[0]?.eventId).data;
  const eventsPath = useBackToEventsPath();

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{several ? 'Tickets issued' : 'Ticket issued'}</h1>
      <Laminate tier punched>
        <div className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-2 px-4 pt-8 pb-4">
          <div className="min-w-0">
            <span className="text-muted-foreground text-xs">{several ? 'Seats' : 'Seat'}</span>
            {several ? (
              <ul className="flex flex-col gap-1">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className="flex items-baseline gap-2">
                    <span className="display text-code-md">{ticket.seat}</span>
                    <span className="text-muted-foreground text-sm">
                      {formatMoney(ticket.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="display text-code-lg block">{tickets[0]?.seat}</span>
            )}
          </div>
          <div className="text-right">
            {several && <span className="text-muted-foreground block text-xs">Total paid</span>}
            <span className="display text-code-md">{formatMoney(result.amount)}</span>
          </div>
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
