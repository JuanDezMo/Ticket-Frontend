import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { createQueryClient } from '@/app/query-client';
import { makeEvent } from '@/test/fixtures/events';
import { eventListRequests, setEvents } from '@/test/msw/event-handlers';
import { useEventFilters, useEvents } from './hooks';

function wrapperAt(url: string) {
  const client = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('useEventFilters', () => {
  it('goes back to page 1 when a filter changes', () => {
    const { result } = renderHook(() => useEventFilters(), {
      wrapper: wrapperAt('/?page=3&status=ACTIVE'),
    });
    expect(result.current.page).toBe(3);

    act(() => result.current.setFilter('type', 'CONCERT'));

    expect(result.current.page).toBe(1);
    expect(result.current.filters).toMatchObject({ status: 'ACTIVE', type: 'CONCERT' });
  });

  it('clears every filter', () => {
    const { result } = renderHook(() => useEventFilters(), {
      wrapper: wrapperAt('/?type=MEETUP&search=rock&page=2'),
    });

    act(() => result.current.clear());

    expect(result.current.filters).toEqual({});
    expect(result.current.page).toBe(1);
  });
});

describe('useEvents', () => {
  it('sends the page size and the filters to the API', async () => {
    setEvents([makeEvent({ type: 'CONCERT' })]);
    const { result } = renderHook(() => useEvents({ type: 'CONCERT' }, 1), {
      wrapper: wrapperAt('/'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const sent = eventListRequests.at(-1)?.searchParams;
    expect(sent?.get('pageSize')).toBe('12');
    expect(sent?.get('type')).toBe('CONCERT');
    expect(result.current.data?.data).toHaveLength(1);
  });

  it('does not query with an inverted date range', () => {
    renderHook(() => useEvents({ from: '2026-12-31', to: '2026-12-01' }, 1), {
      wrapper: wrapperAt('/'),
    });
    expect(eventListRequests).toHaveLength(0);
  });
});
