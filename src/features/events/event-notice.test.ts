import { makeEvent } from '@/test/fixtures/events';
import { getEventNotice } from './event-notice';

const NOW = new Date('2026-11-01T12:00:00Z');

describe('getEventNotice', () => {
  it('returns null for an active future event', () => {
    expect(getEventNotice(makeEvent({ startDate: '2026-12-01T20:00:00Z' }), NOW)).toBeNull();
  });

  it('returns CANCELLED for a cancelled event', () => {
    const event = makeEvent({ status: 'CANCELLED', startDate: '2026-12-01T20:00:00Z' });
    expect(getEventNotice(event, NOW)).toBe('CANCELLED');
  });

  it('returns STARTED when the start date has passed', () => {
    expect(getEventNotice(makeEvent({ startDate: '2026-10-31T20:00:00Z' }), NOW)).toBe('STARTED');
  });

  it('prefers CANCELLED when the event is cancelled and already started', () => {
    const event = makeEvent({ status: 'CANCELLED', startDate: '2026-10-31T20:00:00Z' });
    expect(getEventNotice(event, NOW)).toBe('CANCELLED');
  });
});
