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

interface CancelReservationProps {
  // Las reservas vigentes que se cancelan juntas (todas las del grupo)
  reservations: Reservation[];
  // Hay un pago en curso: cancelar ahora podría cobrar sin emitir el ticket
  paying: boolean;
}

function isAlreadyPaid(reason: unknown): boolean {
  return reason instanceof ApiError && reason.code === ERROR_CODES.RESERVATION_ALREADY_CONFIRMED;
}

/** Cancela la reserva (o todas las del grupo) tras pedir confirmación. */
export function CancelReservation({ reservations, paying }: CancelReservationProps) {
  const cancel = useCancelReservation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const several = reservations.length > 1;
  const eventId = reservations[0]?.eventId ?? '';

  const handleConfirm = async () => {
    // Una cancelación por reserva: el resultado de cada una decide qué se descarta
    const outcomes = await Promise.allSettled(
      reservations.map((reservation) => cancel.mutateAsync(reservation.id)),
    );
    const failures: unknown[] = [];
    outcomes.forEach((outcome, index) => {
      const id = reservations[index]!.id;
      if (outcome.status === 'fulfilled') {
        removeHold(id);
      } else {
        failures.push(outcome.reason);
        if (isAlreadyPaid(outcome.reason)) removeHold(id);
      }
    });
    void queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(eventId) });

    if (failures.length === 0) {
      toast.success(several ? 'Reservations cancelled' : 'Reservation cancelled');
      navigate(ROUTES.eventDetail(eventId));
    } else if (failures.every(isAlreadyPaid)) {
      navigate(ROUTES.myTickets);
    } else {
      // Vencida o cancelada en otra parte: la página vuelve a leer lo que no se canceló
      toast.error(getErrorMessage(failures.find((reason) => !isAlreadyPaid(reason))));
      for (const reservation of reservations) {
        void queryClient.invalidateQueries({ queryKey: reservationKeys.detail(reservation.id) });
      }
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" disabled={paying || cancel.isPending}>
          {several ? 'Cancel all' : 'Cancel reservation'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {several ? 'Cancel all reservations?' : 'Cancel this reservation?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {several
              ? 'All your seats will be released right away and someone else may take them.'
              : 'The seat will be released right away and someone else may take it.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {several ? 'Keep reservations' : 'Keep reservation'}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            Yes, cancel it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
