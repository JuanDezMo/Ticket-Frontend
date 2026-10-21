import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { loginPathWithRedirect } from '@/shared/lib/redirect';
import { Button } from '@/shared/ui/button';
import { StatusMessage } from '@/shared/ui/status-message';
import type { Role } from './roles';
import { useSessionStore } from './session.store';

interface RequireRoleProps {
  // Sin `roles` basta con tener sesión
  roles?: readonly Role[];
  children: ReactNode;
}

export const FORBIDDEN_MESSAGE = 'You do not have permission to view this page';

export function RequireRole({ roles, children }: RequireRoleProps) {
  const role = useSessionStore((state) => state.role);
  const location = useLocation();

  if (!role) {
    return <Navigate to={loginPathWithRedirect(location.pathname + location.search)} replace />;
  }
  if (roles && !roles.includes(role)) {
    return (
      <StatusMessage
        title={FORBIDDEN_MESSAGE}
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.home}>Go to home</Link>
          </Button>
        }
      />
    );
  }
  return children;
}
