import { screen, within } from '@testing-library/react';
import { useSessionStore } from '@/shared/session/session.store';
import { renderRoute, signInAs } from '@/test/render';

async function navLabels() {
  const nav = await screen.findByRole('navigation', { name: 'Main' });
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent);
}

describe('AppLayout', () => {
  it('shows the guest options without a session', async () => {
    renderRoute('/');
    expect(await navLabels()).toEqual(['Events', 'Sign in', 'Sign up']);
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('shows the USER options', async () => {
    signInAs('USER');
    renderRoute('/');
    expect(await navLabels()).toEqual(['Events', 'My tickets']);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('shows the ADMIN options', async () => {
    signInAs('ADMIN');
    renderRoute('/');
    expect(await navLabels()).toEqual(['Events', 'Admin']);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('goes home when clicking the app name', async () => {
    const { user, router } = renderRoute('/register');
    await user.click(await screen.findByRole('link', { name: 'Tickets' }));
    expect(router.state.location.pathname).toBe('/');
  });

  it('signs out and opens the login', async () => {
    signInAs('USER');
    const { user, router } = renderRoute('/my-tickets');

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(useSessionStore.getState().token).toBeNull();
  });
});
