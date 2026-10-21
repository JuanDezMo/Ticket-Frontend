import { QueryClientProvider, useMutation } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http as mswHttp, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { http } from '@/shared/api/http-client';
import { apiPath, errorBody } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { createQueryClient } from './query-client';

describe('query client', () => {
  it('does not retry a failed POST', async () => {
    let calls = 0;
    server.use(
      mswHttp.post(apiPath('/tickets/purchase'), () => {
        calls += 1;
        return HttpResponse.json(errorBody('PAYMENT_GATEWAY_ERROR'), { status: 502 });
      }),
    );
    const client = createQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useMutation({ mutationFn: () => http.post('/tickets/purchase', { body: {} }) }),
      { wrapper },
    );
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(calls).toBe(1);
  });
});
