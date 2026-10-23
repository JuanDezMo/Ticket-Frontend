import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/app/query-client';
import { makeReservation } from '@/test/fixtures/reservations';
import { setReservations } from '@/test/msw/purchase-handlers';
import { signInAs } from '@/test/render';
import { useHoldStore } from './hold.store';
import { useHold } from './hooks';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

describe('useHold', () => {
  beforeEach(() => signInAs('USER'));

  it('keeps an ACTIVE reservation', async () => {
    const reservation = makeReservation();
    setReservations([reservation]);
    useHoldStore.getState().start(reservation);

    const { result } = renderHook(() => useHold(), { wrapper });

    await waitFor(() => expect(result.current?.seatLabel).toBe('C7'));
    expect(useHoldStore.getState().hold).not.toBeNull();
  });

  it('discards a reservation the API reports as EXPIRED', async () => {
    const reservation = makeReservation({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    setReservations([reservation]);
    useHoldStore.getState().start(reservation);

    const { result } = renderHook(() => useHold(), { wrapper });

    await waitFor(() => expect(useHoldStore.getState().hold).toBeNull());
    expect(result.current).toBeNull();
  });

  it.each(['CONFIRMED', 'CANCELLED', 'CANCELLED_BY_USER'] as const)(
    'discards a %s reservation',
    async (status) => {
      const reservation = makeReservation({ status });
      setReservations([reservation]);
      useHoldStore.getState().start(reservation);

      renderHook(() => useHold(), { wrapper });

      await waitFor(() => expect(useHoldStore.getState().hold).toBeNull());
    },
  );

  it('discards a reservation the API does not know', async () => {
    useHoldStore.getState().start(makeReservation());

    renderHook(() => useHold(), { wrapper });

    await waitFor(() => expect(useHoldStore.getState().hold).toBeNull());
  });

  it('returns null without a stored reservation', () => {
    const { result } = renderHook(() => useHold(), { wrapper });
    expect(result.current).toBeNull();
  });
});
