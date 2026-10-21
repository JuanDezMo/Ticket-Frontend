import { makeTestToken } from '@/test/jwt';
import { useSessionStore } from './session.store';

const STORAGE_KEY = 'ticket-session';

// Simula abrir la UI con lo que haya guardado en el navegador
async function rehydrateWith(stored: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: stored, version: 0 }));
  await useSessionStore.persist.rehydrate();
}

describe('session store', () => {
  it('signs in with the user id and role from the token', () => {
    useSessionStore.getState().signIn(makeTestToken({ sub: 'u-9', role: 'ADMIN' }), 'a@mail.com');

    expect(useSessionStore.getState()).toMatchObject({
      userId: 'u-9',
      role: 'ADMIN',
      email: 'a@mail.com',
    });
    expect(useSessionStore.getState().expiresAt).toBeGreaterThan(Date.now());
  });

  it('rejects a token without a valid role', () => {
    expect(() =>
      useSessionStore.getState().signIn(makeTestToken({ role: 'ROOT' }), 'a@mail.com'),
    ).toThrow();
    expect(useSessionStore.getState().token).toBeNull();
  });

  it('signs out and clears the stored session', () => {
    useSessionStore.getState().signIn(makeTestToken(), 'a@mail.com');
    useSessionStore.getState().signOut();

    expect(useSessionStore.getState()).toMatchObject({ token: null, role: null, expired: false });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').state.token).toBeNull();
  });

  it('marks the session as expired', () => {
    useSessionStore.getState().signIn(makeTestToken(), 'a@mail.com');
    useSessionStore.getState().expire();

    expect(useSessionStore.getState()).toMatchObject({ token: null, expired: true });
  });

  it('only stores the token and the email', () => {
    useSessionStore.getState().signIn(makeTestToken({ role: 'USER' }), 'a@mail.com');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').state;
    expect(Object.keys(stored).sort()).toEqual(['email', 'token']);
  });

  it('restores a valid session after a reload', async () => {
    const token = makeTestToken({ sub: 'u-1', role: 'USER' });

    await rehydrateWith({ token, email: 'a@mail.com' });

    expect(useSessionStore.getState()).toMatchObject({ token, role: 'USER', userId: 'u-1' });
  });

  it('discards an expired token after a reload', async () => {
    await rehydrateWith({ token: makeTestToken({ expiresInSeconds: -10 }), email: 'a@mail.com' });

    expect(useSessionStore.getState()).toMatchObject({ token: null, role: null });
  });

  it('discards an unreadable token after a reload', async () => {
    await rehydrateWith({ token: 'not-a-jwt', email: 'a@mail.com' });

    expect(useSessionStore.getState()).toMatchObject({ token: null, role: null });
  });
});
