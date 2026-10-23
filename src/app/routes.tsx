import type { RouteObject } from 'react-router';
import { LoginPage, RegisterPage } from '@/features/auth';
import { EventDetailPage, EventsPage } from '@/features/events';
import { CheckoutPage, MyTicketsPage } from '@/features/tickets';
import { ROUTES } from '@/shared/config/routes';
import { GuestOnly } from '@/shared/session/GuestOnly';
import { RequireRole } from '@/shared/session/RequireRole';
import { ROLES } from '@/shared/session/roles';
import { AppLayout } from './AppLayout';
import { AdminPage, CreateEventPage, CreateUserPage } from './admin-pages';
import { NotFoundPage, RouteErrorPage } from './pages';

// Cada ruta declara su acceso: pública, GuestOnly o RequireRole
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        // El errorElement va dentro del layout para no perder el encabezado
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <EventsPage /> },
          { path: ROUTES.eventDetailPattern, element: <EventDetailPage /> },
          {
            path: ROUTES.login,
            element: (
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            ),
          },
          {
            path: ROUTES.register,
            element: (
              <GuestOnly>
                <RegisterPage />
              </GuestOnly>
            ),
          },
          {
            path: ROUTES.checkoutPattern,
            element: (
              <RequireRole roles={[ROLES.USER]}>
                <CheckoutPage />
              </RequireRole>
            ),
          },
          {
            path: ROUTES.myTickets,
            element: (
              <RequireRole roles={[ROLES.USER]}>
                <MyTicketsPage />
              </RequireRole>
            ),
          },
          {
            path: ROUTES.admin,
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <AdminPage />
              </RequireRole>
            ),
          },
          {
            path: ROUTES.adminNewEvent,
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <CreateEventPage />
              </RequireRole>
            ),
          },
          {
            path: ROUTES.adminNewUser,
            element: (
              <RequireRole roles={[ROLES.ADMIN]}>
                <CreateUserPage />
              </RequireRole>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
