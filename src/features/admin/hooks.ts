import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { eventKeys } from '@/features/events';
import { seatKeys } from '@/features/seats';
import { adminApi } from './api';
import type { CreateUserRequest } from './types';

/** Crea un evento y actualiza el listado y los detalles que ya estén en caché. */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: adminApi.createEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });
  const inFlight = useRef(false);

  // Una segunda llamada mientras hay una en curso se ignora (doble pulsación)
  const { mutateAsync } = mutation;
  const create = useCallback(
    async (...args: Parameters<typeof mutateAsync>) => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      try {
        return await mutateAsync(...args);
      } finally {
        inFlight.current = false;
      }
    },
    [mutateAsync],
  );

  return { create, isPending: mutation.isPending };
}

/** Cancela un evento; al terminar actualiza el listado, el detalle y el mapa de seats. */
export function useCancelEvent() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: adminApi.cancelEvent,
    onSettled: (_data, _error, eventId) => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      void queryClient.invalidateQueries({ queryKey: seatKeys.byEvent(eventId) });
    },
  });
  const inFlight = useRef(false);

  const { mutateAsync } = mutation;
  const cancel = useCallback(
    async (eventId: string) => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      try {
        return await mutateAsync(eventId);
      } finally {
        inFlight.current = false;
      }
    },
    [mutateAsync],
  );

  return { cancel, isPending: mutation.isPending };
}

/**
 * Crea un usuario. La contraseña no queda en la caché: la mutación no se conserva
 * (`gcTime: 0`) y se reinicia al terminar.
 */
export function useCreateUser() {
  const { mutateAsync, reset, isPending } = useMutation({
    mutationFn: adminApi.createUser,
    gcTime: 0,
  });
  const inFlight = useRef(false);

  const create = useCallback(
    async (request: CreateUserRequest) => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      try {
        return await mutateAsync(request);
      } finally {
        inFlight.current = false;
        reset();
      }
    },
    [mutateAsync, reset],
  );

  return { create, isPending };
}
