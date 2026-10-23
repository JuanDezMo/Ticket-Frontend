import { useState } from 'react';
import { Link } from 'react-router';
import { Countdown, type Reservation } from '@/features/reservations';
import { useEvent } from '@/features/events';
import { ROUTES } from '@/shared/config/routes';
import { formatDateTime } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { joinSeatLabels } from '@/shared/lib/join-labels';
import { Laminate } from '@/shared/ui/laminate';
import { usePurchase } from '../hooks';
import type { PurchaseAction } from '../purchase-errors';
import type { PurchaseResult } from '../types';
import { CancelReservation } from './CancelReservation';
import { CardForm } from './CardForm';
import { RemoveSeat } from './RemoveSeat';

interface PayViewProps {
  // Las reservas que se pagan juntas y las del enlace que ya no están vigentes
  payable: Reservation[];
  ended: Reservation[];
  total: number;
  // La que vence primero: su cuenta regresiva es la de la compra
  soonest: Reservation;
  onPaid: (result: PurchaseResult) => void;
  onEnded: (action: PurchaseAction) => void;
  // La cuenta regresiva llegó a cero: la página vuelve a consultar las reservas
  onExpire: () => void;
}

/** Resumen de la compra, cuenta regresiva y formulario de tarjeta de las reservas activas. */
export function PayView({
  payable,
  ended,
  total,
  soonest,
  onPaid,
  onEnded,
  onExpire,
}: PayViewProps) {
  const { pay, isPending } = usePurchase();
  const event = useEvent(soonest.eventId).data;
  // Id de la reserva cuya cuenta llegó a cero: el pago sigue bloqueado hasta que la API confirme
  const [timeUpFor, setTimeUpFor] = useState<string | null>(null);
  const several = payable.length > 1;

  const handleExpire = () => {
    setTimeUpFor(soonest.id);
    onExpire();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      {ended.length > 0 && (
        <p role="status" className="border-input bg-muted rounded-lg border px-4 py-3 text-sm">
          <span className="font-semibold">
            {joinSeatLabels(ended.map((reservation) => reservation.seat))} can no longer be paid.
          </span>{' '}
          They expired or were cancelled.{' '}
          <Link
            to={ROUTES.eventDetail(soonest.eventId)}
            className="font-semibold underline underline-offset-4"
          >
            Back to event
          </Link>
        </p>
      )}
      <Laminate tier punched>
        <div className="flex flex-col gap-3 px-4 pt-8 pb-4">
          <div className="grid grid-cols-[1fr_auto] items-end gap-x-4">
            <div className="min-w-0">
              <span className="text-muted-foreground text-xs">{several ? 'Seats' : 'Seat'}</span>
              {several ? (
                <ul className="flex flex-col gap-1">
                  {payable.map((reservation) => (
                    <li key={reservation.id} className="flex items-center gap-2">
                      <span className="display text-code-md">{reservation.seat}</span>
                      <span className="text-muted-foreground text-sm">
                        {formatMoney(reservation.amount)}
                      </span>
                      <RemoveSeat
                        reservation={reservation}
                        remaining={payable}
                        paying={isPending}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="display text-code-lg block">{soonest.seat}</span>
              )}
            </div>
            <div className="text-right">
              {several && <span className="text-muted-foreground block text-xs">Total</span>}
              <span className="display text-code-md">{formatMoney(total)}</span>
            </div>
          </div>
          {event && (
            <p className="text-sm">
              <span className="font-semibold">{event.name}</span>
              <span className="text-muted-foreground"> · {formatDateTime(event.startDate)}</span>
            </p>
          )}
          <div className="flex items-center gap-3 border-t border-dashed pt-3 text-sm">
            <div className="w-24">
              <Countdown
                key={soonest.id}
                createdAt={soonest.createdAt}
                expiresAt={soonest.expiresAt}
                onExpire={handleExpire}
              />
            </div>
            <span className="text-muted-foreground">left to pay</span>
          </div>
        </div>
      </Laminate>
      <CardForm
        amount={total}
        isPaying={isPending}
        locked={timeUpFor === soonest.id}
        pay={(card) => pay({ reservationIds: payable.map((reservation) => reservation.id), card })}
        onPaid={onPaid}
        onEnded={onEnded}
      />
      <CancelReservation reservations={payable} paying={isPending} />
    </div>
  );
}
