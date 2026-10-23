import { useState } from 'react';
import { Countdown, type Reservation } from '@/features/reservations';
import { useEvent } from '@/features/events';
import { formatDateTime } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import { Laminate } from '@/shared/ui/laminate';
import { usePurchase } from '../hooks';
import type { PurchaseAction } from '../purchase-errors';
import type { IssuedTicket } from '../types';
import { CancelReservation } from './CancelReservation';
import { CardForm } from './CardForm';

interface PayViewProps {
  reservation: Reservation;
  onPaid: (ticket: IssuedTicket) => void;
  onEnded: (action: PurchaseAction) => void;
  // La cuenta regresiva llegó a cero: la página vuelve a consultar la reserva
  onExpire: () => void;
}

/** Resumen de la compra, cuenta regresiva y formulario de tarjeta de una reserva activa. */
export function PayView({ reservation, onPaid, onEnded, onExpire }: PayViewProps) {
  const { pay, isPending } = usePurchase();
  const event = useEvent(reservation.eventId).data;
  const [timeUp, setTimeUp] = useState(false);

  const handleExpire = () => {
    setTimeUp(true);
    onExpire();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <Laminate tier punched>
        <div className="flex flex-col gap-3 px-4 pt-8 pb-4">
          <div className="grid grid-cols-[1fr_auto] items-end gap-x-4">
            <div>
              <span className="text-muted-foreground text-xs">Seat</span>
              <span className="display text-code-lg block">{reservation.seat}</span>
            </div>
            <span className="display text-code-md">{formatMoney(reservation.amount)}</span>
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
                createdAt={reservation.createdAt}
                expiresAt={reservation.expiresAt}
                onExpire={handleExpire}
              />
            </div>
            <span className="text-muted-foreground">left to pay</span>
          </div>
        </div>
      </Laminate>
      <CardForm
        amount={reservation.amount}
        isPaying={isPending}
        locked={timeUp}
        pay={(card) => pay({ reservationId: reservation.id, card })}
        onPaid={onPaid}
        onEnded={onEnded}
      />
      <CancelReservation
        reservationId={reservation.id}
        eventId={reservation.eventId}
        paying={isPending}
      />
    </div>
  );
}
