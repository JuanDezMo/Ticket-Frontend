import { EVENT_STATUSES, type Event } from './types';

export const EVENT_NOTICES = { CANCELLED: 'CANCELLED', STARTED: 'STARTED' } as const;
export type EventNotice = (typeof EVENT_NOTICES)[keyof typeof EVENT_NOTICES];

export const EVENT_NOTICE_MESSAGES: Record<EventNotice, string> = {
  CANCELLED: 'This event has been cancelled',
  STARTED: 'This event has already started',
};

/**
 * Indica si el evento ya no admite reservas. Es solo informativo: el backend
 * vuelve a validarlo al reservar (EVENT_NOT_ACTIVE).
 */
export function getEventNotice(event: Event, now: Date): EventNotice | null {
  if (event.status === EVENT_STATUSES.CANCELLED) return EVENT_NOTICES.CANCELLED;
  if (new Date(event.startDate).getTime() <= now.getTime()) return EVENT_NOTICES.STARTED;
  return null;
}
