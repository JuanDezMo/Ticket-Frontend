import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/app/query-client';
import { useSessionStore } from '@/shared/session/session.store';
import { TEST_USERS } from '@/test/msw/handlers';
import { useLogin } from './hooks';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe('useLogin', () => {
  it('opens the session with the role from the token', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: TEST_USERS.admin.email, password: TEST_USERS.admin.password });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useSessionStore.getState()).toMatchObject({
      role: 'ADMIN',
      userId: TEST_USERS.admin.id,
      email: TEST_USERS.admin.email,
    });
  });
});
