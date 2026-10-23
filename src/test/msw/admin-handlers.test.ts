import { makeEvent } from '@/test/fixtures/events';
import { apiPath } from './handlers-shared';
import { setAdminData } from './admin-handlers';

const call = (path: string, init?: RequestInit) =>
  fetch(`http://localhost${apiPath(path).replace('*', '')}`, init);

describe('admin handlers', () => {
  it('cancels an active event and reports the counts', async () => {
    const event = makeEvent();
    setAdminData({
      events: [event],
      cancellation: { cancelledReservations: 4, cancelledTickets: 12 },
    });

    const response = await call(`/events/${event.id}/cancel`, { method: 'POST' });

    expect(await response.json()).toEqual({
      id: event.id,
      status: 'CANCELLED',
      cancelledReservations: 4,
      cancelledTickets: 12,
    });
  });

  it('answers 409 when the event was already cancelled or ended', async () => {
    const cancelled = makeEvent({ status: 'CANCELLED' });
    const ended = makeEvent({ startDate: '2020-01-01T10:00:00Z', endDate: '2020-01-01T12:00:00Z' });
    setAdminData({ events: [cancelled, ended] });

    expect(
      (await (await call(`/events/${cancelled.id}/cancel`, { method: 'POST' })).json()).code,
    ).toBe('EVENT_ALREADY_CANCELLED');
    expect((await (await call(`/events/${ended.id}/cancel`, { method: 'POST' })).json()).code).toBe(
      'EVENT_ALREADY_ENDED',
    );
  });

  it('rejects a repeated email', async () => {
    setAdminData({ emails: ['boss@mail.com'] });
    const response = await call('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'boss@mail.com', password: 'secret123', role: 'ADMIN' }),
    });
    expect(response.status).toBe(409);
  });
});
