import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const STORAGE_KEY = 'ticket-event-list';

interface EventListState {
  // Query string del último listado visto (por ejemplo "?type=CONCERT&page=2")
  lastSearch: string;
  setLastSearch: (search: string) => void;
}

/**
 * Recuerda los filtros del listado para "Back to events". En sessionStorage:
 * sobrevive al login y a una recarga, pero no pasa a otras pestañas.
 */
export const useEventListStore = create<EventListState>()(
  persist(
    (set) => ({
      lastSearch: '',
      setLastSearch: (lastSearch) => set({ lastSearch }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
