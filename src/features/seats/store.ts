import { create } from 'zustand';

interface SeatSelectionState {
  // Seats elegidos de un solo evento
  eventId: string | null;
  seatLabels: string[];
  // Seats que se quitaron porque dejaron de estar disponibles; la UI los avisa
  lostSeatLabels: string[];
  /** Quita el seat si estaba elegido; si no, lo agrega dentro del cupo. Devuelve si cambió algo. */
  toggle: (eventId: string, seatLabel: string, allowance: number) => boolean;
  releaseUnavailable: (labels: string[]) => void;
  clear: () => void;
}

const EMPTY_SELECTION = { eventId: null, seatLabels: [], lostSeatLabels: [] };

// En memoria a propósito: una selección sin reservar no retiene el seat
export const useSeatSelectionStore = create<SeatSelectionState>()((set, get) => ({
  ...EMPTY_SELECTION,
  toggle: (eventId, seatLabel, allowance) => {
    const state = get();
    const current = state.eventId === eventId ? state.seatLabels : [];
    if (current.includes(seatLabel)) {
      const seatLabels = current.filter((label) => label !== seatLabel);
      set(seatLabels.length > 0 ? { seatLabels, lostSeatLabels: [] } : EMPTY_SELECTION);
      return true;
    }
    if (allowance < 1) return false;
    // Con cupo para un solo seat, elegir otro reemplaza al anterior
    if (allowance === 1) {
      set({ eventId, seatLabels: [seatLabel], lostSeatLabels: [] });
      return true;
    }
    if (current.length >= allowance) return false;
    set({ eventId, seatLabels: [...current, seatLabel], lostSeatLabels: [] });
    return true;
  },
  releaseUnavailable: (labels) =>
    set((state) => ({
      seatLabels: state.seatLabels.filter((label) => !labels.includes(label)),
      lostSeatLabels: labels,
    })),
  clear: () => set(EMPTY_SELECTION),
}));

export function clearSeatSelection(): void {
  useSeatSelectionStore.getState().clear();
}
