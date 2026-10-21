import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { apiPath, TAKEN_EMAIL } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderRoute } from '@/test/render';

async function fillForm(
  user: ReturnType<typeof renderRoute>['user'],
  email: string,
  password: string,
) {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterPage', () => {
  it('creates the account and opens the login with the email filled in', async () => {
    let body: unknown;
    server.use(
      http.post(apiPath('/auth/register'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 'n1', email: 'ana@mail.com', role: 'USER', createdAt: '' },
          { status: 201 },
        );
      }),
    );
    const { user, router } = renderRoute('/register');

    await fillForm(user, 'ana@mail.com', 'secret123');

    expect(await screen.findByText('Account created. Please sign in')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByLabelText('Email')).toHaveValue('ana@mail.com');
    // El registro público nunca envía un rol
    expect(body).toEqual({ email: 'ana@mail.com', password: 'secret123' });
  });

  it('shows client errors without calling the API', async () => {
    const { user } = renderRoute('/register');

    await fillForm(user, 'ana', 'short');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('shows EMAIL_ALREADY_EXISTS on the email field', async () => {
    const { user } = renderRoute('/register');

    await fillForm(user, TAKEN_EMAIL, 'secret123');

    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('keeps the values when the API rejects the form', async () => {
    server.use(
      http.post(apiPath('/auth/register'), () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: 'Invalid request' },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderRoute('/register');

    await fillForm(user, 'ana@mail.com', 'secret123');

    expect(
      await screen.findByText('Some fields are invalid. Please review them and try again'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('ana@mail.com');
    expect(screen.getByLabelText('Password')).toHaveValue('secret123');
  });
});
