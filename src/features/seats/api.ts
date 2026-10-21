import { http } from '@/shared/api/http-client';
import type { SeatList } from './types';

export const seatsApi = {
  listByEvent: (eventId: string) => http.get<SeatList>(`/events/${eventId}/seats`),
};
