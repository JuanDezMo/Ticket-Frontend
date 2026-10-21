import { useEventListStore } from './store';

const STORAGE_KEY = 'ticket-event-list';

describe('event list store', () => {
  it('stores the last search in sessionStorage, not localStorage', () => {
    useEventListStore.getState().setLastSearch('?type=CONCERT');

    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}').state.lastSearch).toBe(
      '?type=CONCERT',
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restores the last search after a reload', async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { lastSearch: '?status=ACTIVE&page=2' }, version: 0 }),
    );

    await useEventListStore.persist.rehydrate();

    expect(useEventListStore.getState().lastSearch).toBe('?status=ACTIVE&page=2');
  });
});
