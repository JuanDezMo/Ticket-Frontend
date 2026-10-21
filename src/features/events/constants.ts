import type { EventStatus, EventType } from './types';

export const EVENTS_PAGE_SIZE = 12;

// Espera tras la última tecla antes de buscar
export const SEARCH_DEBOUNCE_MS = 300;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CONCERT: 'Concert',
  MEETUP: 'Meetup',
  MEETING: 'Meeting',
  OTHER: 'Other',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  ACTIVE: 'Active',
  CANCELLED: 'Cancelled',
};
