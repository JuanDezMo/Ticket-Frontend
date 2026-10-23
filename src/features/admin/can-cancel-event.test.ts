import { makeEvent } from '@/test/fixtures/events';
import { canCancelEvent } from './can-cancel-event';

const NOW = new Date('2026-10-22T12:00:00Z');

describe('canCancelEvent', () => {
  it('allows an active event that has not ended', () => {
    expect(canCancelEvent(makeEvent({ endDate: '2026-12-01T23:00:00Z' }), NOW)).toBe(true);
  });

  it('allows an active event that already started but has not ended', () => {
    const event = makeEvent({ startDate: '2026-10-22T10:00:00Z', endDate: '2026-10-22T15:00:00Z' });
    expect(canCancelEvent(event, NOW)).toBe(true);
  });

  it('does not allow a cancelled event', () => {
    expect(
      canCancelEvent(makeEvent({ status: 'CANCELLED', endDate: '2026-12-01T23:00:00Z' }), NOW),
    ).toBe(false);
  });

  it('does not allow an event that already ended', () => {
    const event = makeEvent({ startDate: '2026-10-01T10:00:00Z', endDate: '2026-10-01T12:00:00Z' });
    expect(canCancelEvent(event, NOW)).toBe(false);
  });
});
