import { waitFor } from '@testing-library/react';
import { useHoldStore } from '@/features/reservations';
import { makeReservation } from '@/test/fixtures/reservations';
import { renderRoute, signInAs } from '@/test/render';
import { useSessionStore } from '@/shared/session/session.store';

describe('Providers', () => {
  it('clears the reservation in progress when the session ends', async () => {
    signInAs('USER');
    renderRoute('/');
    useHoldStore.getState().add([makeReservation()]);
    expect(useHoldStore.getState().holds).toHaveLength(1);

    useSessionStore.getState().signOut();

    await waitFor(() => expect(useHoldStore.getState().holds).toHaveLength(0));
  });
});
