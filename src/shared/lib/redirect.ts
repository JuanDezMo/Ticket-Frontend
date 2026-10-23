import { REDIRECT_PARAM, ROUTES } from '@/shared/config/routes';

/**
 * Solo acepta rutas internas ("/algo"). Descarta "//host" y "/\host", que el navegador
 * interpreta como otro dominio, para evitar open redirects.
 */
export function getSafeRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return ROUTES.home;
  }
  if (value === ROUTES.login || value.startsWith(`${ROUTES.login}?`)) {
    return ROUTES.home;
  }
  return value;
}

export function loginPathWithRedirect(redirect: string): string {
  const params = new URLSearchParams({ [REDIRECT_PARAM]: redirect });
  return `${ROUTES.login}?${params.toString()}`;
}

export function registerPathWithRedirect(redirect: string): string {
  const params = new URLSearchParams({ [REDIRECT_PARAM]: redirect });
  return `${ROUTES.register}?${params.toString()}`;
}
