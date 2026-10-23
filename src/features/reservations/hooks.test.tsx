import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/app/query-client';
import { makeReservation, minutesFromNow } from '@/test/fixtures/reservations';
import { setReservations } from '@/test/msw/purchase-handlers';
import { signInAs } from '@/test/render';
import { useHoldStore } from './hold.store';
import { useHolds } from './hooks';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>;
}

const stored = () => useHoldStore.getState().holds;

describe('useHolds', () => {
  beforeEach(() => signInAs('USER'));

  it('keeps an ACTIVE reservation', async () => {
    const reservation = makeReservation();
    setReservations([reservation]);
    useHoldStore.getState().add([reservation]);

    const { result } = renderHook(() => useHolds(), { wrapper });

    await waitFor(() => expect(result.current[0]?.seatLabel).toBe('C7'));
    expect(stored()).toHaveLength(1);
  });

  it('discards a reservation the API reports as EXPIRED', async () => {
    const reservation = makeReservation({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    setReservations([reservation]);
    useHoldStore.getState().add([reservation]);

    const { result } = renderHook(() => useHolds(), { wrapper });

    await waitFor(() => expect(stored()).toHaveLength(0));
    expect(result.current).toEqual([]);
  });

  it.each(['CONFIRMED', 'CANCELLED', 'CANCELLED_BY_USER'] as const)(
    'discards a %s reservation',
    async (status) => {
      const reservation = makeReservation({ status });
      setReservations([reservation]);
      useHoldStore.getState().add([reservation]);

      renderHook(() => useHolds(), { wrapper });

      await waitFor(() => expect(stored()).toHaveLength(0));
    },
  );

  it('discards a reservation the API does not know', async () => {
    useHoldStore.getState().add([makeReservation()]);

    renderHook(() => useHolds(), { wrapper });

    await waitFor(() => expect(stored()).toHaveLength(0));
  });

  it('discards only the reservation that ended and keeps the other', async () => {
    const active = makeReservation({ seat: 'C8' });
    const expired = makeReservation({
      seat: 'C7',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    setReservations([expired, active]);
    useHoldStore.getState().add([expired, active]);

    const { result } = renderHook(() => useHolds(), { wrapper });

    await waitFor(() => expect(stored().map((hold) => hold.seatLabel)).toEqual(['C8']));
    expect(result.current.map((hold) => hold.seatLabel)).toEqual(['C8']);
  });

  it('orders the reservations by the one that expires first', async () => {
    const later = makeReservation({ seat: 'C7', expiresAt: minutesFromNow(9) });
    const sooner = makeReservation({ seat: 'D2', expiresAt: minutesFromNow(3) });
    setReservations([later, sooner]);
    useHoldStore.getState().add([later, sooner]);

    const { result } = renderHook(() => useHolds(), { wrapper });

    await waitFor(() => expect(result.current.map((hold) => hold.seatLabel)).toEqual(['D2', 'C7']));
  });

  it('returns an empty list without stored reservations', () => {
    const { result } = renderHook(() => useHolds(), { wrapper });
    expect(result.current).toEqual([]);
  });
});
