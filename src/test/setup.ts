import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { useSessionStore } from '@/shared/session/session.store';
import { resetEventData } from './msw/event-handlers';
import { server } from './msw/server';

// Cualquier solicitud sin handler hace fallar la prueba
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetEventData();
  useSessionStore.getState().signOut();
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => server.close());
