import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { Providers } from '@/app/providers';
import { createQueryClient } from '@/app/query-client';
import { routes } from '@/app/routes';
import { useSessionStore } from '@/shared/session/session.store';
import { makeTestToken } from './jwt';

// Agrega rutas de prueba dentro del layout, junto a las páginas reales
function withExtraRoutes(extraRoutes: RouteObject[]): RouteObject[] {
  if (extraRoutes.length === 0) return routes;
  const [layout] = routes;
  const [content] = layout?.children ?? [];
  if (!layout || layout.index || !content || content.index) return routes;
  return [
    {
      ...layout,
      children: [{ ...content, children: [...extraRoutes, ...(content.children ?? [])] }],
    },
  ];
}

/** Monta la aplicación completa en una ruta, con red simulada por MSW. */
export function renderRoute(path: string, extraRoutes: RouteObject[] = []) {
  const router = createMemoryRouter(withExtraRoutes(extraRoutes), { initialEntries: [path] });
  const queryClient = createQueryClient();
  const user = userEvent.setup();
  const result = render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...result, router, queryClient, user };
}

/** Abre una sesión de prueba sin pasar por el login. */
export function signInAs(role: 'USER' | 'ADMIN', email = `${role.toLowerCase()}@mail.com`) {
  useSessionStore.getState().signIn(makeTestToken({ sub: `${role}-id`, role }), email);
}
