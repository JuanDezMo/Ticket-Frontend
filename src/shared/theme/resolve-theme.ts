import { THEME_PREFERENCES, type ThemePreference } from './theme.store';

export const RESOLVED_THEMES = { LIGHT: 'light', DARK: 'dark' } as const;
export type ResolvedTheme = (typeof RESOLVED_THEMES)[keyof typeof RESOLVED_THEMES];

/** "system" sigue al sistema operativo; "light" y "dark" lo ignoran. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === THEME_PREFERENCES.LIGHT) return RESOLVED_THEMES.LIGHT;
  if (preference === THEME_PREFERENCES.DARK) return RESOLVED_THEMES.DARK;
  return systemPrefersDark ? RESOLVED_THEMES.DARK : RESOLVED_THEMES.LIGHT;
}
