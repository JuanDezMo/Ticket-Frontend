import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { removeHold, reservationKeys, useCancelReservation } from '@/features/reservations';
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

interface CancelReservationProps {
  reservationId: string;
  eventId: string;
  // Hay un pago en curso: cancelar ahora podría cobrar sin emitir el ticket
  paying: boolean;
}

/** Cancela la reserva tras pedir confirmación. */
export function CancelReservation({ reservationId, eventId, paying }: CancelReservationProps) {
  const cancel = useCancelReservation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleConfirm = () =>
    cancel.mutate(reservationId, {
      onSuccess: () => {
        removeHold(reservationId);
        void queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(eventId) });
        toast.success('Reservation cancelled');
        navigate(ROUTES.eventDetail(eventId));
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === ERROR_CODES.RESERVATION_ALREADY_CONFIRMED) {
          removeHold(reservationId);
          navigate(ROUTES.myTickets);
          return;
        }
        // Vencida o cancelada en otra parte: la página vuelve a leer la reserva y muestra su estado
        toast.error(getErrorMessage(error));
        void queryClient.invalidateQueries({ queryKey: reservationKeys.detail(reservationId) });
      },
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" disabled={paying || cancel.isPending}>
          Cancel reservation
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
          <AlertDialogDescription>
            The seat will be released right away and someone else may take it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep reservation</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            Yes, cancel it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
