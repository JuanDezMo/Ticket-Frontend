import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { Toaster } from '@/shared/ui/sonner';
import { setMedia } from '@/test/media';
import { resolveTheme } from './resolve-theme';
import { THEME_STORAGE_KEY, useThemeStore } from './theme.store';
import { ThemeMenu } from './ThemeMenu';
import { useApplyTheme } from './use-theme';

const isDark = () => document.documentElement.classList.contains('dark');

describe('resolveTheme', () => {
  it.each([
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
    ['system', false, 'light'],
    ['system', true, 'dark'],
  ] as const)('%s with system dark=%s resolves to %s', (preference, systemDark, expected) => {
    expect(resolveTheme(preference, systemDark)).toBe(expected);
  });
});

describe('theme store', () => {
  it('defaults to system and stores the choice in localStorage', () => {
    expect(useThemeStore.getState().preference).toBe('system');

    useThemeStore.getState().setPreference('dark');

    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}').state.preference).toBe(
      'dark',
    );
  });
});

describe('useApplyTheme', () => {
  it('follows the system theme', () => {
    setMedia({ dark: true });
    renderHook(() => useApplyTheme());
    expect(isDark()).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('switches live when the system theme changes', () => {
    renderHook(() => useApplyTheme());
    expect(isDark()).toBe(false);

    act(() => setMedia({ dark: true }));

    expect(isDark()).toBe(true);
  });

  it('ignores the system when a theme is pinned', () => {
    useThemeStore.getState().setPreference('light');
    renderHook(() => useApplyTheme());

    act(() => setMedia({ dark: true }));

    expect(isDark()).toBe(false);
  });
});

describe('ThemeMenu', () => {
  it('pins the dark theme and names the current option', async () => {
    renderHook(() => useApplyTheme());
    render(<ThemeMenu />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Theme: System' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    expect(useThemeStore.getState().preference).toBe('dark');
    expect(isDark()).toBe(true);
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument();
  });
});

describe('Toaster', () => {
  it('uses the active theme', async () => {
    useThemeStore.getState().setPreference('dark');
    const { container } = render(<Toaster />);

    act(() => {
      toast('Saved');
    });

    await screen.findByText('Saved');
    expect(container.ownerDocument.querySelector('[data-sonner-theme]')).toHaveAttribute(
      'data-sonner-theme',
      'dark',
    );
  });
});
