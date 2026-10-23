import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  removeHold,
  reservationKeys,
  useCancelReservation,
  type Reservation,
} from '@/features/reservations';
import { seatKeys } from '@/features/seats';
import { ApiError, ERROR_CODES } from '@/shared/api/api-error';
import { getErrorMessage } from '@/shared/api/error-messages';
import { ROUTES } from '@/shared/config/routes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';

interface RemoveSeatProps {
  reservation: Reservation;
  // Las reservas vigentes del grupo, incluida esta
  remaining: Reservation[];
  // Hay un pago en curso: cancelar ahora podría cobrar sin emitir el ticket
  paying: boolean;
}

/** Cancela solo la reserva de un seat del grupo, tras pedir confirmación. */
export function RemoveSeat({ reservation, remaining, paying }: RemoveSeatProps) {
  const cancel = useCancelReservation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleConfirm = () =>
    cancel.mutate(reservation.id, {
      onSuccess: () => {
        removeHold(reservation.id);
        void queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(reservation.eventId) });
        // El seat sale del enlace: recargar la página no lo trae de vuelta
        const left = remaining.filter((item) => item.id !== reservation.id).map((item) => item.id);
        navigate(ROUTES.checkoutFor(left), { replace: true });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === ERROR_CODES.RESERVATION_ALREADY_CONFIRMED) {
          removeHold(reservation.id);
          navigate(ROUTES.myTickets);
          return;
        }
        // Vencida o cancelada en otra parte: la página vuelve a leer la reserva
        toast.error(getErrorMessage(error));
        void queryClient.invalidateQueries({ queryKey: reservationKeys.detail(reservation.id) });
      },
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          aria-label={`Remove ${reservation.seat}`}
          disabled={paying || cancel.isPending}
        >
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {reservation.seat}?</AlertDialogTitle>
          <AlertDialogDescription>
            Its reservation will be cancelled and the seat released right away. Your other seats
            stay reserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep seat</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            Yes, remove it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
