import type { MyTicketsQuery } from './types';

export const ticketKeys = {
  all: ['tickets'] as const,
  mine: (query: MyTicketsQuery) => ['tickets', 'mine', query] as const,
};
