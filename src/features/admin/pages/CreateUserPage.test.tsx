import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { FORBIDDEN_MESSAGE } from '@/shared/session/RequireRole';
import { REDIRECT_PARAM, ROUTES } from '@/shared/config/routes';
import { useSessionStore } from '@/shared/session/session.store';
import { createUserRequests, setAdminData } from '@/test/msw/admin-handlers';
import { apiPath } from '@/test/msw/handlers-shared';
import { server } from '@/test/msw/server';
import { renderRoute, signInAs } from '@/test/render';
import { waitFor } from '@testing-library/react';

type User = ReturnType<typeof renderRoute>['user'];

async function fill(user: User, email: string, password: string, role?: string) {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  if (role) await user.selectOptions(screen.getByLabelText('Role'), role);
}

const submit = () => screen.getByRole('button', { name: /^(Create user|Creating)/ });

describe('CreateUserPage', () => {
  beforeEach(() => signInAs('ADMIN'));

  it('creates an ADMIN and leaves the form empty', async () => {
    const { user } = renderRoute(ROUTES.adminNewUser);
    await fill(user, 'boss@mail.com', 'secret123', 'Admin');

    await user.click(submit());

    expect(await screen.findByText('User created: boss@mail.com (Admin)')).toBeInTheDocument();
    expect(createUserRequests).toEqual([
      { email: 'boss@mail.com', password: 'secret123', role: 'ADMIN' },
    ]);
    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Role')).toHaveValue('');
  });

  it('creates a USER', async () => {
    const { user } = renderRoute(ROUTES.adminNewUser);
    await fill(user, 'ana@mail.com', 'secret123', 'User');

    await user.click(submit());

    expect(await screen.findByText('User created: ana@mail.com (User)')).toBeInTheDocument();
    expect(createUserRequests[0]?.role).toBe('USER');
  });

  it('validates in the client and sends nothing', async () => {
    const { user } = renderRoute(ROUTES.adminNewUser);
    await fill(user, 'not-an-email', '1234567');

    await user.click(submit());

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Choose a role')).toBeInTheDocument();
    expect(createUserRequests).toHaveLength(0);
  });

  it('has no default role, so creating an admin is a decision', async () => {
    renderRoute(ROUTES.adminNewUser);
    expect(await screen.findByLabelText('Role')).toHaveValue('');
  });

  it('shows "Creating..." and sends one request on a double click', async () => {
    const requests = vi.fn();
    server.use(
      http.post(apiPath('/users'), async () => {
        requests();
        await delay(150);
        return HttpResponse.json(
          { id: 'u1', email: 'ana@mail.com', role: 'USER', createdAt: new Date().toISOString() },
          { status: 201 },
        );
      }),
    );
    const { user } = renderRoute(ROUTES.adminNewUser);
    await fill(user, 'ana@mail.com', 'secret123', 'User');

    await user.dblClick(submit());

    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
    await screen.findByText('User created: ana@mail.com (User)');
    expect(requests).toHaveBeenCalledTimes(1);
  });

  it('shows a repeated email next to the field, keeps email and role and clears the password', async () => {
    setAdminData({ emails: ['boss@mail.com'] });
    const { user } = renderRoute(ROUTES.adminNewUser);
    await fill(user, 'boss@mail.com', 'secret123', 'Admin');

    await user.click(submit());

    expect(
      await screen.findByText('An account with this email already exists'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('boss@mail.com');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Role')).toHaveValue('ADMIN');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('shows the network error and lets the user retry', async () => {
    server.use(http.post(apiPath('/users'), () => HttpResponse.error()));
    const { user } = renderRoute(ROUTES.adminNewUser);
    await fill(user, 'ana@mail.com', 'secret123', 'User');

    await user.click(submit());

    expect(
      await screen.findByText('Cannot reach the server. Check your connection and try again'),
    ).toBeInTheDocument();
    expect(submit()).toBeEnabled();
  });
});

describe('create user access', () => {
  it('shows the forbidden page to a USER', async () => {
    signInAs('USER');
    renderRoute(ROUTES.adminNewUser);
    expect(await screen.findByText(FORBIDDEN_MESSAGE)).toBeInTheDocument();
  });

  it('sends a visitor to the login and back', async () => {
    useSessionStore.getState().signOut();
    const { router } = renderRoute(ROUTES.adminNewUser);

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.login));
    expect(new URLSearchParams(router.state.location.search).get(REDIRECT_PARAM)).toBe(
      ROUTES.adminNewUser,
    );
  });
});
