import { http, HttpResponse } from 'msw';
import { makeTestToken } from '../jwt';
import { eventHandlers } from './event-handlers';
import { apiPath, errorBody } from './handlers-shared';

export { apiPath, errorBody };

export const TEST_USERS = {
  user: { id: 'user-1', email: 'user@mail.com', password: 'secret123', role: 'USER' },
  admin: { id: 'admin-1', email: 'admin@mail.com', password: 'secret123', role: 'ADMIN' },
} as const;

export const TAKEN_EMAIL = 'taken@mail.com';

// Respuestas por defecto; cada prueba puede cambiarlas con server.use(...)
export const handlers = [
  ...eventHandlers,
  http.post(apiPath('/auth/login'), async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = Object.values(TEST_USERS).find(
      (candidate) => candidate.email === email && candidate.password === password,
    );
    if (!user) {
      return HttpResponse.json(errorBody('INVALID_CREDENTIALS', 'Invalid email or password'), {
        status: 401,
      });
    }
    return HttpResponse.json({
      accessToken: makeTestToken({ sub: user.id, role: user.role }),
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
  }),

  http.post(apiPath('/auth/register'), async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    if (email === TAKEN_EMAIL) {
      return HttpResponse.json(errorBody('EMAIL_ALREADY_EXISTS', 'Email already exists'), {
        status: 409,
      });
    }
    return HttpResponse.json(
      { id: 'new-user', email, role: 'USER', createdAt: new Date().toISOString() },
      { status: 201 },
    );
  }),
];
