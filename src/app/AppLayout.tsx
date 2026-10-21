import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { ROLES, type Role } from '@/shared/session/roles';
import { useSessionStore } from '@/shared/session/session.store';
import { Button } from '@/shared/ui/button';
import { useSessionExpiry } from './use-session-expiry';

interface NavItem {
  label: string;
  to: string;
}

const GUEST = 'GUEST';

// Opciones del encabezado por rol; "Sign out" se agrega aparte para quien tiene sesión
const NAV_ITEMS: Record<Role | typeof GUEST, NavItem[]> = {
  [GUEST]: [
    { label: 'Events', to: ROUTES.home },
    { label: 'Sign in', to: ROUTES.login },
    { label: 'Sign up', to: ROUTES.register },
  ],
  [ROLES.USER]: [
    { label: 'Events', to: ROUTES.home },
    { label: 'My tickets', to: ROUTES.myTickets },
  ],
  [ROLES.ADMIN]: [
    { label: 'Events', to: ROUTES.home },
    { label: 'Admin', to: ROUTES.admin },
  ],
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground';

export function AppLayout() {
  useSessionExpiry();
  const role = useSessionStore((state) => state.role);
  const email = useSessionStore((state) => state.email);
  const signOut = useSessionStore((state) => state.signOut);
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate(ROUTES.login);
    signOut();
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to={ROUTES.home} className="text-lg font-semibold">
            Tickets
          </Link>
          <nav aria-label="Main" className="flex items-center gap-4 text-sm">
            {NAV_ITEMS[role ?? GUEST].map((item) => (
              <NavLink key={item.to} to={item.to} end className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
            {role && (
              <>
                <span className="text-muted-foreground hidden sm:inline">{email}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
