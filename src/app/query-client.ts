import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/api-error';

const MAX_QUERY_RETRIES = 1;

function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Un 4xx no cambia al reintentar; solo se reintentan fallos de red o 5xx
        retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_QUERY_RETRIES,
        refetchOnWindowFocus: false,
      },
      // Nunca se reintenta un POST automáticamente: el reintento lo inicia el usuario
      mutations: { retry: false },
    },
  });
}
