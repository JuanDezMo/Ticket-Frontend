import type { EventListQuery } from './types';

export const eventKeys = {
  all: ['events'] as const,
  list: (query: EventListQuery) => ['events', 'list', query] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};
