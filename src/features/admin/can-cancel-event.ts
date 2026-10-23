import { EVENT_STATUSES, type Event } from '@/features/events';

/**
 * Un evento se puede cancelar mientras esté activo y no haya terminado. Es solo una ayuda de la
 * pantalla: ticket-api vuelve a validarlo (EVENT_ALREADY_CANCELLED y EVENT_ALREADY_ENDED).
 */
export function canCancelEvent(event: Event, now: Date): boolean {
  return (
    event.status === EVENT_STATUSES.ACTIVE && new Date(event.endDate).getTime() > now.getTime()
  );
}
