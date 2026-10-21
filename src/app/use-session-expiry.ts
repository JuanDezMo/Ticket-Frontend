import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ROUTES } from '@/shared/config/routes';
import { loginPathWithRedirect } from '@/shared/lib/redirect';
import { useSessionStore } from '@/shared/session/session.store';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again';

/** Cierra la sesión cuando vence el token y, al vencer, lleva al login recordando la página. */
export function useSessionExpiry(): void {
  const expiresAt = useSessionStore((state) => state.expiresAt);
  const expired = useSessionStore((state) => state.expired);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(
      () => useSessionStore.getState().expire(),
      Math.max(expiresAt - Date.now(), 0),
    );
    return () => clearTimeout(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (!expired) return;
    useSessionStore.getState().acknowledgeExpiry();
    toast.error(SESSION_EXPIRED_MESSAGE);
    if (location.pathname !== ROUTES.login) {
      navigate(loginPathWithRedirect(location.pathname + location.search), { replace: true });
    }
  }, [expired, location.pathname, location.search, navigate]);
}
