import { useMutation } from '@tanstack/react-query';
import { useSessionStore } from '@/shared/session/session.store';
import { authApi } from './api';
import type { Credentials } from './types';

export function useRegister() {
  return useMutation({ mutationFn: authApi.register });
}

export function useLogin() {
  const signIn = useSessionStore((state) => state.signIn);
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const response = await authApi.login(credentials);
      signIn(response.accessToken, credentials.email);
      return response;
    },
  });
}
