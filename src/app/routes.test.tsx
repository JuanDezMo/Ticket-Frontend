import { screen } from '@testing-library/react';
import { renderRoute, signInAs } from '@/test/render';

function Boom(): never {
  throw new Error('render failure');
}

describe('routes', () => {
  it('sends a guest to the login with the original path', async () => {
    const { router } = renderRoute('/my-tickets');

    await screen.findByRole('button', { name: 'Sign in' });
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?redirect=%2Fmy-tickets');
  });

  it('shows the forbidden page to a USER on /admin', async () => {
    signInAs('USER');
    renderRoute('/admin');

    expect(
      await screen.findByText('You do not have permission to view this page'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toBeInTheDocument();
  });

  it('shows the admin page to an ADMIN', async () => {
    signInAs('ADMIN');
    renderRoute('/admin');

    expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument();
  });

  it('shows "Page not found" for unknown routes', async () => {
    renderRoute('/does-not-exist');

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toBeInTheDocument();
  });

  it('shows the error page when a page fails to render', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderRoute('/boom', [{ path: '/boom', element: <Boom /> }]);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    // El encabezado sigue visible
    expect(screen.getByRole('link', { name: 'Tickets' })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
