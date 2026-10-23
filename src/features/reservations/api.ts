import { http } from '@/shared/api/http-client';
import type { Reservation, ReservationBatch } from './types';

export const reservationsApi = {
  // Todo o nada: la API reserva todos los seats de la lista o ninguno
  create: async (eventId: string, seats: string[]) => {
    const { reservations } = await http.post<ReservationBatch>('/reservations', {
      body: { eventId, seats },
    });
    return reservations;
  },
  getById: (id: string) => http.get<Reservation>(`/reservations/${id}`),
  cancel: (id: string) => http.post<Reservation>(`/reservations/${id}/cancel`),
};
