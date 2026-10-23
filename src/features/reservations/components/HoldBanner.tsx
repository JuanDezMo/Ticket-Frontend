import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { useCheckoutIds } from '@/shared/lib/checkout-ids';
import { ROLES } from '@/shared/session/roles';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';
import { useHolds, useReservation } from '../hooks';
import { Countdown } from './Countdown';

/** Aviso de la reserva en curso; el checkout de esa reserva ya muestra su cuenta regresiva. */
export function HoldBanner() {
  const role = useSessionStore((state) => state.role);
  const holds = useHolds();
  // La que vence primero: su cuenta regresiva y su checkout son los del aviso
  const hold = holds[0];
  const checkout = useCheckoutIds();
  const reservation = useReservation(hold?.reservationId);

  if (role !== ROLES.USER || !hold) return null;
  // Una compra es de un solo evento: el enlace lleva a las reservas de ese evento
  const groupIds = holds
    .filter((item) => item.eventId === hold.eventId)
    .map((item) => item.reservationId);
  // El checkout abierto ya incluye la reserva a la que enlaza: su cuenta regresiva está en la página
  if (checkout?.ids.includes(hold.reservationId)) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <Laminate
        role="region"
        aria-label="Reservation in progress"
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
      >
        <p className="text-sm font-semibold">
          {holds.length === 1 ? `Seat ${hold.seatLabel} is held` : `${holds.length} seats held`}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-24">
            <Countdown
              createdAt={hold.createdAt}
              expiresAt={hold.expiresAt}
              onExpire={() => void reservation.refetch()}
            />
          </div>
          <span className="text-muted-foreground">left</span>
        </div>
        <Button asChild className="sm:ml-auto">
          <Link to={ROUTES.checkoutFor(groupIds)}>Continue to checkout</Link>
        </Button>
      </Laminate>
    </div>
  );
}
