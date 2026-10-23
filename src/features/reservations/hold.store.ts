import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Reservation } from './types';

const STORAGE_KEY = 'ticket-hold';
// 1: una sola reserva (`hold`). 2: una lista (`holds`)
const STORAGE_VERSION = 2;

// Lo único que se recuerda de cada reserva: la API es la fuente de verdad del resto
export interface Hold {
  reservationId: string;
  eventId: string;
  seatLabel: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
}

interface HoldState {
  holds: Hold[];
  add: (reservations: Reservation[]) => void;
  remove: (reservationId: string) => void;
  clear: () => void;
}

type PersistedHolds = Pick<HoldState, 'holds'>;

function toHold(reservation: Reservation): Hold {
  return {
    reservationId: reservation.id,
    eventId: reservation.eventId,
    seatLabel: reservation.seat,
    amount: reservation.amount,
    createdAt: reservation.createdAt,
    expiresAt: reservation.expiresAt,
  };
}

/** Lo guardado con la forma anterior (`{ hold }`) pasa a una lista; lo ilegible se descarta. */
function migrate(persisted: unknown): PersistedHolds {
  const old = persisted as { hold?: Hold | null; holds?: Hold[] } | null;
  if (Array.isArray(old?.holds)) return { holds: old.holds };
  return { holds: old?.hold ? [old.hold] : [] };
}

// sessionStorage: sobrevive a una recarga, pero no pasa a otra pestaña ni a otra sesión del
// navegador. No guarda datos de tarjeta ni del usuario.
export const useHoldStore = create<HoldState>()(
  persist(
    (set) => ({
      holds: [],
      add: (reservations) =>
        set((state) => {
          const known = new Set(state.holds.map((hold) => hold.reservationId));
          const added = reservations.filter((reservation) => !known.has(reservation.id));
          return { holds: [...state.holds, ...added.map(toHold)] };
        }),
      remove: (reservationId) =>
        set((state) => ({
          holds: state.holds.filter((hold) => hold.reservationId !== reservationId),
        })),
      clear: () => set({ holds: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): PersistedHolds => ({ holds: state.holds }),
      migrate: (persisted) => migrate(persisted),
    },
  ),
);

export function removeHold(reservationId: string): void {
  useHoldStore.getState().remove(reservationId);
}

export function clearHolds(): void {
  useHoldStore.getState().clear();
}
