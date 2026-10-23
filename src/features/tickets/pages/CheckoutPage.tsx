import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router';
import { clearHold, useReservation } from '@/features/reservations';
import { seatKeys } from '@/features/seats';
import { ApiError } from '@/shared/api/api-error';
import { getErrorMessage } from '@/shared/api/error-messages';
import { isUuid } from '@/shared/lib/is-uuid';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusMessage } from '@/shared/ui/status-message';
import { ENDED_BY_ACTION, ENDED_BY_STATUS, ENDED_KINDS, type EndedKind } from '../checkout-views';
import { EndedView } from '../components/EndedView';
import { PayView } from '../components/PayView';
import { TicketIssuedView } from '../components/TicketIssuedView';
import type { PurchaseAction } from '../purchase-errors';
import { ticketKeys } from '../query-keys';
import type { IssuedTicket } from '../types';

// Estados de la API que significan "esta reserva no es tuya o no existe"
const MISSING_STATUSES = [403, 404];

export function CheckoutPage() {
  const { reservationId } = useParams();
  const reservation = useReservation(reservationId);
  const queryClient = useQueryClient();
  const [issued, setIssued] = useState<IssuedTicket | null>(null);
  const [ended, setEnded] = useState<EndedKind | null>(null);

  if (!isUuid(reservationId)) return <EndedView kind={ENDED_KINDS.NOT_FOUND} />;
  if (issued) return <TicketIssuedView ticket={issued} />;
  if (ended) return <EndedView kind={ended} eventId={reservation.data?.eventId} />;

  const { data, error } = reservation;
  if (error instanceof ApiError && MISSING_STATUSES.includes(error.status)) {
    return <EndedView kind={ENDED_KINDS.NOT_FOUND} />;
  }
  if (error || !data) {
    if (!error) return <Skeleton aria-label="Loading checkout" className="h-64 rounded-xl" />;
    return (
      <StatusMessage
        title={getErrorMessage(error)}
        action={<Button onClick={() => void reservation.refetch()}>Try again</Button>}
      />
    );
  }

  const endedKind = ENDED_BY_STATUS[data.status];
  if (endedKind) return <EndedView kind={endedKind} eventId={data.eventId} />;

  const handlePaid = (ticket: IssuedTicket) => {
    clearHold();
    void queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(ticket.eventId) });
    void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    setIssued(ticket);
  };

  const handleEnded = (action: PurchaseAction) => {
    clearHold();
    const kind = ENDED_BY_ACTION[action];
    if (kind) setEnded(kind);
  };

  return (
    <PayView
      reservation={data}
      onPaid={handlePaid}
      onEnded={handleEnded}
      onExpire={() => void reservation.refetch()}
    />
  );
}
