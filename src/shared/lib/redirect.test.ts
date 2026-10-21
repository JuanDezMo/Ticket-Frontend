import { getSafeRedirect, loginPathWithRedirect } from './redirect';

describe('getSafeRedirect', () => {
  it.each(['/my-tickets', '/events?page=2'])('accepts the internal path %s', (path) => {
    expect(getSafeRedirect(path)).toBe(path);
  });

  it.each([null, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/login', '/login?x=1'])(
    'falls back to home for %s',
    (value) => {
      expect(getSafeRedirect(value)).toBe('/');
    },
  );
});

describe('loginPathWithRedirect', () => {
  it('encodes the original path', () => {
    expect(loginPathWithRedirect('/events?page=2')).toBe('/login?redirect=%2Fevents%3Fpage%3D2');
  });
});
