import { screen } from '@testing-library/react';
import { jwtDecode } from 'jwt-decode';
import { makeTestToken } from './jwt';
import { renderRoute } from './render';

describe('test setup', () => {
  it('renders the app at a route', async () => {
    renderRoute('/');
    expect(await screen.findByRole('link', { name: 'Tickets' })).toBeInTheDocument();
  });

  it('builds tokens with sub, role and exp', () => {
    const claims = jwtDecode<{ sub: string; role: string; exp: number }>(
      makeTestToken({ sub: 'abc', role: 'ADMIN' }),
    );
    expect(claims).toMatchObject({ sub: 'abc', role: 'ADMIN' });
    expect(claims.exp * 1000).toBeGreaterThan(Date.now());
  });
});
