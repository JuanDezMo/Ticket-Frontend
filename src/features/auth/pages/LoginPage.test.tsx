import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { useSessionStore } from '@/shared/session/session.store';
import { apiPath, TEST_USERS } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';

async function submit(
  user: ReturnType<typeof renderRoute>['user'],
  email: string,
  password: string,
) {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginPage', () => {
  it('signs in and goes to home when there is no redirect', async () => {
    const { user, router } = renderRoute('/login');

    await submit(user, TEST_USERS.user.email, TEST_USERS.user.password);

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(useSessionStore.getState().role).toBe('USER');
  });

  it('goes to the internal redirect after signing in', async () => {
    const { user, router } = renderRoute('/login?redirect=%2Fmy-tickets');

    await submit(user, TEST_USERS.user.email, TEST_USERS.user.password);

    expect(await screen.findByRole('heading', { name: 'My tickets' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/my-tickets');
  });

  it('ignores an external redirect', async () => {
    const { user, router } = renderRoute('/login?redirect=https%3A%2F%2Fevil.com');

    await submit(user, TEST_USERS.user.email, TEST_USERS.user.password);

    await screen.findByRole('button', { name: 'Sign out' });
    expect(router.state.location.pathname).toBe('/');
  });

  it('keeps the email and clears the password on invalid credentials', async () => {
    const { user } = renderRoute('/login');

    await submit(user, TEST_USERS.user.email, 'wrong-password');

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue(TEST_USERS.user.email);
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('disables the button while the request is in flight', async () => {
    server.use(
      http.post(apiPath('/auth/login'), async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const { user } = renderRoute('/login');

    await submit(user, TEST_USERS.user.email, TEST_USERS.user.password);

    expect(await screen.findByRole('button', { name: 'Signing in...' })).toBeDisabled();
  });

  it('sends a signed-in user to home', async () => {
    signInAs('USER');
    const { router } = renderRoute('/login');

    await screen.findByRole('button', { name: 'Sign out' });
    expect(router.state.location.pathname).toBe('/');
  });
});
