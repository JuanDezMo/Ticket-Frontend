import { useEffect } from 'react';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { RESOLVED_THEMES, resolveTheme, type ResolvedTheme } from './resolve-theme';
import { useThemeStore } from './theme.store';

export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';
const DARK_CLASS = 'dark';

/** Tema que se ve ahora: la preferencia guardada o, con "system", el del sistema operativo. */
export function useResolvedTheme(): ResolvedTheme {
  const preference = useThemeStore((state) => state.preference);
  const systemPrefersDark = useMediaQuery(SYSTEM_DARK_QUERY);
  return resolveTheme(preference, systemPrefersDark);
}

/** Aplica el tema resuelto en <html>; el script de index.html ya lo hizo antes del primer pintado. */
export function useApplyTheme(): void {
  const theme = useResolvedTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(DARK_CLASS, theme === RESOLVED_THEMES.DARK);
    root.style.colorScheme = theme;
  }, [theme]);
}
