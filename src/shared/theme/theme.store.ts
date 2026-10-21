import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const THEME_PREFERENCES = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' } as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[keyof typeof THEME_PREFERENCES];

// La misma clave la lee el script de index.html para aplicar el tema antes del pintado
export const THEME_STORAGE_KEY = 'ticket-theme';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: THEME_PREFERENCES.SYSTEM,
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
