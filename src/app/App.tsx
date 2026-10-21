import { createBrowserRouter, RouterProvider } from 'react-router';
import { Providers } from './providers';
import { createQueryClient } from './query-client';
import { routes } from './routes';

const router = createBrowserRouter(routes);
const queryClient = createQueryClient();

export function App() {
  return (
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>
  );
}
