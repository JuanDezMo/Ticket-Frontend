import { http } from '@/shared/api/http-client';
import type { Reservation } from './types';

export const reservationsApi = {
  create: (eventId: string, seat: string) =>
    http.post<Reservation>('/reservations', { body: { eventId, seat } }),
  getById: (id: string) => http.get<Reservation>(`/reservations/${id}`),
  cancel: (id: string) => http.post<Reservation>(`/reservations/${id}/cancel`),
};
