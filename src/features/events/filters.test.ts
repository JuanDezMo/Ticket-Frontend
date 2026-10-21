import { isDateRangeValid, parseFilters, parsePage, toApiQuery, toSearchParams } from './filters';

const params = (query: string) => new URLSearchParams(query);

describe('parseFilters', () => {
  it('reads valid values', () => {
    expect(
      parseFilters(params('status=ACTIVE&type=MEETUP&from=2026-12-01&to=2026-12-31&search=rock')),
    ).toEqual({
      status: 'ACTIVE',
      type: 'MEETUP',
      from: '2026-12-01',
      to: '2026-12-31',
      search: 'rock',
    });
  });

  it('ignores invalid values without affecting the others', () => {
    expect(parseFilters(params('type=FESTIVAL&status=ACTIVE&from=12/01/2026&search=%20'))).toEqual({
      status: 'ACTIVE',
    });
  });
});

describe('parsePage', () => {
  it.each([
    ['page=3', 3],
    ['', 1],
    ['page=abc', 1],
    ['page=0', 1],
    ['page=1.5', 1],
  ])('reads "%s" as page %i', (query, expected) => {
    expect(parsePage(params(query))).toBe(expected);
  });
});

describe('toSearchParams', () => {
  it('omits empty filters and the first page', () => {
    expect(toSearchParams({ type: 'CONCERT', search: '' }, 1).toString()).toBe('type=CONCERT');
    expect(toSearchParams({}, 2).toString()).toBe('page=2');
  });
});

describe('isDateRangeValid', () => {
  it('rejects an inverted range', () => {
    expect(isDateRangeValid({ from: '2026-12-31', to: '2026-12-01' })).toBe(false);
    expect(isDateRangeValid({ from: '2026-12-01', to: '2026-12-01' })).toBe(true);
    expect(isDateRangeValid({ from: '2026-12-01' })).toBe(true);
  });
});

describe('toApiQuery', () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/Bogota';
  });
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('sends the start and end of the local days with the page size', () => {
    expect(toApiQuery({ type: 'CONCERT', from: '2026-12-01', to: '2026-12-31' }, 2)).toEqual({
      page: 2,
      pageSize: 12,
      type: 'CONCERT',
      status: undefined,
      search: undefined,
      // Bogotá es UTC-5
      startFrom: '2026-12-01T05:00:00.000Z',
      startTo: '2027-01-01T04:59:59.999Z',
    });
  });
});
