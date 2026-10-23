import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/app/query-client';
import { eventKeys } from '@/features/events';
import { makeEvent } from '@/test/fixtures/events';
import {
  cancelEventRequests,
  createEventRequests,
  createUserRequests,
  setAdminData,
} from '@/test/msw/admin-handlers';
import { signInAs } from '@/test/render';
import { useCancelEvent, useCreateEvent, useCreateUser } from './hooks';
import type { CreateEventRequest } from './types';

const client = createQueryClient();

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const newEvent: CreateEventRequest = {
  name: 'Rock Night',
  description: 'Live',
  type: 'CONCERT',
  venue: 'Main Hall',
  price: 49.99,
  capacity: 25,
  maxSeatsPerUser: 4,
  startDate: '2030-01-01T20:00:00.000Z',
  endDate: '2030-01-01T23:00:00.000Z',
};

describe('admin hooks', () => {
  beforeEach(() => {
    signInAs('ADMIN');
    client.clear();
  });

  it('creates an event and invalidates the event lists', async () => {
    client.setQueryData(eventKeys.list({ page: 1, pageSize: 12 }), { data: [], meta: {} });
    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    let created;
    await act(async () => {
      created = await result.current.create(newEvent);
    });

    expect(created).toMatchObject({ name: 'Rock Night', status: 'ACTIVE' });
    expect(client.getQueryState(eventKeys.list({ page: 1, pageSize: 12 }))?.isInvalidated).toBe(
      true,
    );
  });

  it('sends one request when called twice at once', async () => {
    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    await act(async () => {
      await Promise.all([result.current.create(newEvent), result.current.create(newEvent)]);
    });

    expect(createEventRequests).toHaveLength(1);
  });

  it('cancels an event and reports the counts', async () => {
    const event = makeEvent();
    setAdminData({
      events: [event],
      cancellation: { cancelledReservations: 4, cancelledTickets: 12 },
    });
    const { result } = renderHook(() => useCancelEvent(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.cancel(event.id);
    });

    expect(response).toMatchObject({
      status: 'CANCELLED',
      cancelledReservations: 4,
      cancelledTickets: 12,
    });
    expect(cancelEventRequests).toEqual([event.id]);
  });

  it('rejects with the API error when the event was already cancelled', async () => {
    const event = makeEvent({ status: 'CANCELLED' });
    setAdminData({ events: [event] });
    const { result } = renderHook(() => useCancelEvent(), { wrapper });

    await act(async () => {
      await expect(result.current.cancel(event.id)).rejects.toMatchObject({
        code: 'EVENT_ALREADY_CANCELLED',
      });
    });
  });

  it('creates a user without keeping the password in the mutation cache', async () => {
    const { result } = renderHook(() => useCreateUser(), { wrapper });

    await act(async () => {
      await result.current.create({
        email: 'boss@mail.com',
        password: 'secret-pass-1',
        role: 'ADMIN',
      });
    });

    expect(createUserRequests).toHaveLength(1);
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(0));
    expect(
      JSON.stringify(
        client
          .getMutationCache()
          .getAll()
          .map((m) => m.state),
      ),
    ).not.toContain('secret-pass-1');
  });
});
