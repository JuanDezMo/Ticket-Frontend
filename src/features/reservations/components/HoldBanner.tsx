import { Link, useMatch } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { ROLES } from '@/shared/session/roles';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';
import { useHold, useReservation } from '../hooks';
import { Countdown } from './Countdown';

/** Aviso de la reserva en curso; el checkout de esa reserva ya muestra su cuenta regresiva. */
export function HoldBanner() {
  const role = useSessionStore((state) => state.role);
  const hold = useHold();
  const checkout = useMatch(ROUTES.checkoutPattern);
  const reservation = useReservation(hold?.reservationId);

  if (role !== ROLES.USER || !hold) return null;
  if (checkout?.params.reservationId === hold.reservationId) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <Laminate
        role="region"
        aria-label="Reservation in progress"
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
      >
        <p className="text-sm font-semibold">Seat {hold.seatLabel} is held</p>
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
          <Link to={ROUTES.checkout(hold.reservationId)}>Continue to checkout</Link>
        </Button>
      </Laminate>
    </div>
  );
}
