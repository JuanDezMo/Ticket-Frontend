import { create } from 'zustand';

interface SeatSelectionState {
  // Solo se elige un seat a la vez, de un solo evento
  eventId: string | null;
  seatLabel: string | null;
  // Seat que se quitó porque dejó de estar disponible; la UI lo avisa
  lostSeatLabel: string | null;
  toggle: (eventId: string, seatLabel: string) => void;
  releaseUnavailable: () => void;
  clear: () => void;
}

const EMPTY_SELECTION = { eventId: null, seatLabel: null, lostSeatLabel: null };

// En memoria a propósito: una selección sin reservar no retiene el seat
export const useSeatSelectionStore = create<SeatSelectionState>()((set) => ({
  ...EMPTY_SELECTION,
  toggle: (eventId, seatLabel) =>
    set((state) =>
      state.eventId === eventId && state.seatLabel === seatLabel
        ? EMPTY_SELECTION
        : { eventId, seatLabel, lostSeatLabel: null },
    ),
  releaseUnavailable: () => set((state) => ({ seatLabel: null, lostSeatLabel: state.seatLabel })),
  clear: () => set(EMPTY_SELECTION),
}));

export function clearSeatSelection(): void {
  useSeatSelectionStore.getState().clear();
}
