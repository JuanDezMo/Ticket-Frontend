import { toast } from 'sonner';
import type { Event } from '@/features/events';
import { getErrorMessage } from '@/shared/api/error-messages';
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
import { useCancelEvent } from '../hooks';

const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Cancela el evento tras explicar qué se pierde; el resultado dice cuántas reservas y tickets. */
export function CancelEvent({ event }: { event: Event }) {
  const { cancel, isPending } = useCancelEvent();

  const handleConfirm = async () => {
    try {
      const result = await cancel(event.id);
      if (!result) return;
      toast.success(
        `Event cancelled: ${pluralize(result.cancelledReservations, 'reservation')} and ${pluralize(result.cancelledTickets, 'ticket')} cancelled`,
      );
    } catch (error) {
      // La lista se vuelve a leer sola: otro administrador pudo haberlo cancelado
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={isPending}
          aria-label={`Cancel event ${event.name}`}
        >
          {isPending ? 'Cancelling...' : 'Cancel event'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel {event.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            All its reservations and tickets will be cancelled. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep event</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void handleConfirm()}>
            Yes, cancel event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
