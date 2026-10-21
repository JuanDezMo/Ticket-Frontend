import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { http as apiHttp } from '@/shared/api/http-client';
import { useSessionStore } from '@/shared/session/session.store';
import { makeTestToken } from '@/test/jwt';
import { apiPath, errorBody, TEST_USERS } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderRoute } from '@/test/render';

const SESSION_EXPIRED = 'Your session has expired. Please sign in again';

describe('session flow', () => {
  it('returns to the protected page after signing in, and back to login on 401', async () => {
    const { user, router } = renderRoute('/my-tickets');

    // 1. El visitante termina en el login
    await user.type(await screen.findByLabelText('Email'), TEST_USERS.user.email);
    await user.type(screen.getByLabelText('Password'), TEST_USERS.user.password);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // 2. Tras iniciar sesión vuelve a /my-tickets
    expect(await screen.findByRole('heading', { name: 'My tickets' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/my-tickets');

    // 3. La API rechaza el token: sesión cerrada, mensaje y login con redirect
    server.use(
      http.get(apiPath('/tickets/me'), () =>
        HttpResponse.json(errorBody('UNAUTHORIZED'), { status: 401 }),
      ),
    );
    await apiHttp.get('/tickets/me').catch(() => undefined);

    expect(await screen.findByText(SESSION_EXPIRED)).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?redirect=%2Fmy-tickets');
    expect(useSessionStore.getState().token).toBeNull();
  });

  it('expires the session when the token reaches its expiry time', async () => {
    useSessionStore.getState().signIn(makeTestToken({ expiresInSeconds: 1 }), 'user@mail.com');
    const { router } = renderRoute('/my-tickets');

    expect(await screen.findByText(SESSION_EXPIRED, {}, { timeout: 3000 })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?redirect=%2Fmy-tickets');
  });

  it('clears cached server data when the session ends', async () => {
    useSessionStore.getState().signIn(makeTestToken(), 'user@mail.com');
    const { queryClient } = renderRoute('/');
    queryClient.setQueryData(['tickets', 'me'], { data: ['ticket'] });

    useSessionStore.getState().signOut();

    expect(queryClient.getQueryData(['tickets', 'me'])).toBeUndefined();
  });
});
