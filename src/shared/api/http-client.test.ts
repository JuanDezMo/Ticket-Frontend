import { http as mswHttp, HttpResponse } from 'msw';
import { apiPath, errorBody } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { signInAs } from '@/test/render';
import { useSessionStore } from '@/shared/session/session.store';
import { ApiError, ERROR_CODES } from './api-error';
import { http } from './http-client';

function captureAuthHeader() {
  const seen: { authorization: string | null } = { authorization: null };
  server.use(
    mswHttp.get(apiPath('/ping'), ({ request }) => {
      seen.authorization = request.headers.get('Authorization');
      return HttpResponse.json({ ok: true });
    }),
  );
  return seen;
}

describe('http client', () => {
  it('sends requests under the API base path with query params', async () => {
    let url = '';
    server.use(
      mswHttp.get(apiPath('/events'), ({ request }) => {
        url = request.url;
        return HttpResponse.json({ data: [] });
      }),
    );

    await http.get('/events', { query: { page: 2, type: undefined } });

    expect(new URL(url).pathname).toBe('/api/events');
    expect(new URL(url).search).toBe('?page=2');
  });

  it('sends the bearer token when there is a session', async () => {
    const seen = captureAuthHeader();
    signInAs('USER');

    await http.get('/ping');

    expect(seen.authorization).toBe(`Bearer ${useSessionStore.getState().token}`);
  });

  it('does not send the Authorization header without a session', async () => {
    const seen = captureAuthHeader();

    await http.get('/ping');

    expect(seen.authorization).toBeNull();
  });

  it('turns { code, message } responses into ApiError', async () => {
    server.use(
      mswHttp.post(apiPath('/reservations'), () =>
        HttpResponse.json(errorBody('SEAT_NOT_AVAILABLE', 'Seat is not available'), {
          status: 409,
        }),
      ),
    );

    const error = await http.post('/reservations', { body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'SEAT_NOT_AVAILABLE' });
  });

  it('uses UNKNOWN when the error body is not valid', async () => {
    server.use(mswHttp.get(apiPath('/ping'), () => new HttpResponse('<html>', { status: 500 })));

    await expect(http.get('/ping')).rejects.toMatchObject({
      status: 500,
      code: ERROR_CODES.UNKNOWN,
    });
  });

  it('uses NETWORK_ERROR when the request cannot reach the server', async () => {
    server.use(mswHttp.get(apiPath('/ping'), () => HttpResponse.error()));

    await expect(http.get('/ping')).rejects.toMatchObject({ code: ERROR_CODES.NETWORK_ERROR });
  });

  it('expires the session when an authenticated request gets 401', async () => {
    server.use(
      mswHttp.get(apiPath('/tickets/me'), () =>
        HttpResponse.json(errorBody('UNAUTHORIZED'), { status: 401 }),
      ),
    );
    signInAs('USER');

    await expect(http.get('/tickets/me')).rejects.toBeInstanceOf(ApiError);

    expect(useSessionStore.getState()).toMatchObject({ token: null, expired: true });
  });

  it('does not expire the session on a 401 from the login endpoint', async () => {
    signInAs('USER');

    await expect(
      http.post('/auth/login', { body: { email: 'x@mail.com', password: 'wrong' } }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    expect(useSessionStore.getState().expired).toBe(false);
  });
});
