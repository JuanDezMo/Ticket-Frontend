import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { useEventListStore } from '@/features/events/store';
import { useSessionStore } from '@/shared/session/session.store';
import { THEME_PREFERENCES, useThemeStore } from '@/shared/theme/theme.store';
import { installMatchMedia, resetMedia } from './media';
import { resetEventData } from './msw/event-handlers';
import { server } from './msw/server';

installMatchMedia();

// Cualquier solicitud sin handler hace fallar la prueba
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetEventData();
  resetMedia();
  useSessionStore.getState().signOut();
  useEventListStore.setState({ lastSearch: '' });
  useThemeStore.setState({ preference: THEME_PREFERENCES.SYSTEM });
  document.documentElement.className = '';
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => server.close());
