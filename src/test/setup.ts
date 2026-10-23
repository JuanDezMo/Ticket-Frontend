import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toast } from 'sonner';
import { useHoldStore } from '@/features/reservations/hold.store';
import { useEventListStore } from '@/features/events/store';
import { useSessionStore } from '@/shared/session/session.store';
import { THEME_PREFERENCES, useThemeStore } from '@/shared/theme/theme.store';
import { installMatchMedia, resetMedia } from './media';
import { resetAdminData } from './msw/admin-handlers';
import { resetEventData } from './msw/event-handlers';
import { resetPurchaseData } from './msw/purchase-handlers';
import { server } from './msw/server';

installMatchMedia();
// jsdom no implementa scrollIntoView
Element.prototype.scrollIntoView = () => {};

// Cualquier solicitud sin handler hace fallar la prueba
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  toast.dismiss();
  server.resetHandlers();
  resetEventData();
  resetAdminData();
  resetPurchaseData();
  resetMedia();
  useSessionStore.getState().signOut();
  useEventListStore.setState({ lastSearch: '' });
  useHoldStore.setState({ holds: [] });
  useThemeStore.setState({ preference: THEME_PREFERENCES.SYSTEM });
  document.documentElement.className = '';
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => server.close());
