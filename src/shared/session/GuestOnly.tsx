import type { ReactNode } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { REDIRECT_PARAM } from '@/shared/config/routes';
import { getSafeRedirect } from '@/shared/lib/redirect';
import { useSessionStore } from './session.store';

/**
 * Para login y registro. Con sesión abierta lleva a `redirect` (si es una ruta interna)
 * o al inicio; así, tras iniciar sesión, la redirección ocurre en un solo lugar.
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const role = useSessionStore((state) => state.role);
  const [searchParams] = useSearchParams();

  if (role) {
    return <Navigate to={getSafeRedirect(searchParams.get(REDIRECT_PARAM))} replace />;
  }
  return children;
}
