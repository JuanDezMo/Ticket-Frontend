import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Reservation } from './types';

const STORAGE_KEY = 'ticket-hold';

// Lo único que se recuerda de la reserva: la API es la fuente de verdad del resto
export interface Hold {
  reservationId: string;
  eventId: string;
  seatLabel: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
}

interface HoldState {
  hold: Hold | null;
  start: (reservation: Reservation) => void;
  clear: () => void;
}

type PersistedHold = Pick<HoldState, 'hold'>;

// sessionStorage: sobrevive a una recarga, pero no pasa a otra pestaña ni a otra sesión del
// navegador. No guarda datos de tarjeta ni del usuario.
export const useHoldStore = create<HoldState>()(
  persist(
    (set) => ({
      hold: null,
      start: (reservation) =>
        set({
          hold: {
            reservationId: reservation.id,
            eventId: reservation.eventId,
            seatLabel: reservation.seat,
            amount: reservation.amount,
            createdAt: reservation.createdAt,
            expiresAt: reservation.expiresAt,
          },
        }),
      clear: () => set({ hold: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): PersistedHold => ({ hold: state.hold }),
    },
  ),
);

export function clearHold(): void {
  useHoldStore.getState().clear();
}
