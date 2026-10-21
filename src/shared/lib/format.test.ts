import { formatDateRange, formatDateTime } from './format-date';
import { formatMoney } from './format-money';

describe('formatDateTime', () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/New_York';
  });
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('shows a UTC date in the local time zone', () => {
    // 01:00 UTC del 2 de diciembre = 20:00 del 1 de diciembre en Nueva York
    expect(formatDateTime('2026-12-02T01:00:00Z')).toBe('Dec 1, 2026, 8:00 PM');
  });

  it('shows only the end time when the range is on the same day', () => {
    expect(formatDateRange('2026-12-01T20:00:00Z', '2026-12-01T23:00:00Z')).toBe(
      'Dec 1, 2026, 3:00 PM – 6:00 PM',
    );
  });

  it('shows both dates when the range spans several days', () => {
    expect(formatDateRange('2026-12-01T15:00:00Z', '2026-12-03T15:00:00Z')).toBe(
      'Dec 1, 2026, 10:00 AM – Dec 3, 2026, 10:00 AM',
    );
  });
});

describe('formatMoney', () => {
  it('formats amounts in USD', () => {
    expect(formatMoney(150000)).toBe('$150,000.00');
    expect(formatMoney(49.5)).toBe('$49.50');
  });
});
