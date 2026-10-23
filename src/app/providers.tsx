import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { clearHolds } from '@/features/reservations';
import { clearSeatSelection } from '@/features/seats';
import { useSessionStore } from '@/shared/session/session.store';
import { Toaster } from '@/shared/ui/sonner';

interface ProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

export function Providers({ queryClient, children }: ProvidersProps) {
  // Al cerrar o vencer la sesión se borran los datos, la selección y la reserva en curso del usuario anterior
  useEffect(
    () =>
      useSessionStore.subscribe((state, previous) => {
        if (previous.token && !state.token) {
          queryClient.clear();
          clearSeatSelection();
          clearHolds();
        }
      }),
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
