const ONE_HOUR_SECONDS = 3600;

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

interface TestTokenClaims {
  sub?: string;
  role?: string;
  // Segundos desde ahora; negativo para un token vencido
  expiresInSeconds?: number;
}

// La firma no es válida: el cliente solo decodifica el token, no lo verifica
export function makeTestToken({
  sub = 'user-1',
  role = 'USER',
  expiresInSeconds = ONE_HOUR_SECONDS,
}: TestTokenClaims = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64Url({ sub, role, iat: now, exp: now + expiresInSeconds });
  return `${header}.${payload}.test-signature`;
}
