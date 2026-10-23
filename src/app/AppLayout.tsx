import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { HoldBanner } from '@/features/reservations';
import { ROUTES } from '@/shared/config/routes';
import { ROLES, type Role } from '@/shared/session/roles';
import { useSessionStore } from '@/shared/session/session.store';
import { ThemeMenu } from '@/shared/theme/ThemeMenu';
import { useApplyTheme } from '@/shared/theme/use-theme';
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

// 44 px de alto en móvil para el pulgar; el activo se marca con peso y subrayado, no solo color
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex min-h-11 items-center px-1 whitespace-nowrap underline-offset-8 sm:min-h-9 sm:px-2',
    isActive
      ? 'font-semibold text-foreground underline decoration-tier decoration-2'
      : 'text-muted-foreground hover:text-foreground',
  ].join(' ');

export function AppLayout() {
  useSessionExpiry();
  useApplyTheme();
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
      <header className="bg-background/90 sticky top-0 z-20 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-1 px-3 sm:h-16 sm:gap-2 sm:px-4">
          <Link
            to={ROUTES.home}
            className="display inline-flex min-h-11 items-center text-base sm:text-lg"
          >
            Tickets
          </Link>
          <nav aria-label="Main" className="flex items-center text-sm sm:gap-3">
            {NAV_ITEMS[role ?? GUEST].map((item) => (
              <NavLink key={item.to} to={item.to} end className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
            {role && (
              <>
                <span className="text-muted-foreground hidden max-w-48 truncate md:inline">
                  {email}
                </span>
                <Button variant="outline" className="px-2 sm:px-3" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            )}
            <ThemeMenu />
          </nav>
        </div>
      </header>
      <HoldBanner />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
