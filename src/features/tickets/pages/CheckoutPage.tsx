import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  groupCheckout,
  removeHold,
  RESERVATION_STATUSES,
  useReservations,
  type Reservation,
} from '@/features/reservations';
import { seatKeys } from '@/features/seats';
import { ApiError } from '@/shared/api/api-error';
import { getErrorMessage } from '@/shared/api/error-messages';
import { useCheckoutIds } from '@/shared/lib/checkout-ids';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusMessage } from '@/shared/ui/status-message';
import { ENDED_BY_ACTION, ENDED_BY_STATUS, ENDED_KINDS, type EndedKind } from '../checkout-views';
import { EndedView } from '../components/EndedView';
import { PayView } from '../components/PayView';
import { TicketIssuedView } from '../components/TicketIssuedView';
import { PURCHASE_ACTIONS, type PurchaseAction } from '../purchase-errors';
import { ticketKeys } from '../query-keys';
import type { PurchaseResult } from '../types';

// Estados de la API que significan "esta reserva no es tuya o no existe"
const MISSING_STATUSES = [403, 404];

/** La vista que corresponde cuando ninguna reserva del grupo se puede pagar. */
function endedKindOf(reservations: Reservation[]): EndedKind {
  if (reservations.every((item) => item.status === RESERVATION_STATUSES.CONFIRMED)) {
    return ENDED_KINDS.PAID;
  }
  const notPaid = reservations.find((item) => item.status !== RESERVATION_STATUSES.CONFIRMED);
  return (notPaid && ENDED_BY_STATUS[notPaid.status]) || ENDED_KINDS.EXPIRED;
}

export function CheckoutPage() {
  const checkout = useCheckoutIds();
  const valid = !!checkout?.valid;
  const ids = valid ? checkout.ids : [];
  const group = useReservations(ids);
  const queryClient = useQueryClient();
  const [issued, setIssued] = useState<PurchaseResult | null>(null);
  const [ended, setEnded] = useState<EndedKind | null>(null);

  if (!valid) return <EndedView kind={ENDED_KINDS.NOT_FOUND} />;
  if (issued) return <TicketIssuedView result={issued} />;

  const reservations = group.reservations.filter((item): item is Reservation => !!item);
  const eventId = reservations[0]?.eventId;
  if (ended) return <EndedView kind={ended} eventId={eventId} count={ids.length} />;

  const { error } = group;
  if (error instanceof ApiError && MISSING_STATUSES.includes(error.status)) {
    return <EndedView kind={ENDED_KINDS.NOT_FOUND} />;
  }
  if (error) {
    return (
      <StatusMessage
        title={getErrorMessage(error)}
        action={<Button onClick={() => void group.refetchAll()}>Try again</Button>}
      />
    );
  }
  if (group.isLoading || reservations.length < ids.length) {
    return <Skeleton aria-label="Loading checkout" className="h-64 rounded-xl" />;
  }

  const state = groupCheckout(reservations);
  // Una compra es de un solo evento: un enlace que mezcla eventos no existe
  if (!state.sameEvent) return <EndedView kind={ENDED_KINDS.NOT_FOUND} />;
  if (state.payable.length === 0) {
    return <EndedView kind={endedKindOf(reservations)} eventId={eventId} count={ids.length} />;
  }

  const handlePaid = (result: PurchaseResult) => {
    for (const ticket of result.tickets) removeHold(ticket.reservationId);
    void queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(state.payable[0]!.eventId) });
    void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    setIssued(result);
  };

  const handleEnded = (action: PurchaseAction) => {
    // Con varias reservas la API no dice cuál venció o se canceló: se consulta cada una y la
    // pantalla muestra lo que ya no está vigente
    const unnamed =
      action === PURCHASE_ACTIONS.SHOW_EXPIRED || action === PURCHASE_ACTIONS.SHOW_CANCELLED;
    if (unnamed && state.payable.length > 1) {
      void group.refetchAll();
      return;
    }
    for (const reservation of state.payable) removeHold(reservation.id);
    const kind = ENDED_BY_ACTION[action];
    if (kind) setEnded(kind);
  };

  return (
    <PayView
      payable={state.payable}
      ended={state.ended}
      total={state.total}
      soonest={state.soonest!}
      onPaid={handlePaid}
      onEnded={handleEnded}
      onExpire={() => void group.refetchAll()}
    />
  );
}
