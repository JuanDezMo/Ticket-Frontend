import { MAX_CHECKOUT_IDS, parseCheckoutIds } from './checkout-ids';

const ids = (count: number) => Array.from({ length: count }, () => crypto.randomUUID());

describe('parseCheckoutIds', () => {
  it('accepts the id of the path', () => {
    const [id] = ids(1);
    expect(parseCheckoutIds(id, '')).toEqual({ ids: [id], valid: true });
  });

  it.each([1, 3, MAX_CHECKOUT_IDS])('accepts %i ids in the query', (count) => {
    const list = ids(count);
    const result = parseCheckoutIds(undefined, `?ids=${list.join(',')}`);
    expect(result).toEqual({ ids: list, valid: true });
  });

  it('keeps the order of the link', () => {
    const [a, b, c] = ids(3);
    expect(parseCheckoutIds(undefined, `?ids=${c},${a},${b}`).ids).toEqual([c, a, b]);
  });

  it('rejects more than 8 ids', () => {
    expect(parseCheckoutIds(undefined, `?ids=${ids(9).join(',')}`).valid).toBe(false);
  });

  it.each([
    ['no ids', ''],
    ['an empty list', '?ids='],
    ['an id that is not a UUID', '?ids=abc'],
    ['a valid id followed by an invalid one', `?ids=${crypto.randomUUID()},nope`],
    ['an empty item', `?ids=${crypto.randomUUID()},`],
  ])('rejects %s', (_label, search) => {
    expect(parseCheckoutIds(undefined, search).valid).toBe(false);
  });

  it('rejects a repeated id', () => {
    const [id] = ids(1);
    expect(parseCheckoutIds(undefined, `?ids=${id},${id}`).valid).toBe(false);
  });

  it('rejects a path id that is not a UUID', () => {
    expect(parseCheckoutIds('abc', '').valid).toBe(false);
  });
});

describe('ROUTES.checkoutFor', () => {
  it('uses the path for one reservation and the query for several', async () => {
    const { ROUTES } = await import('@/shared/config/routes');
    expect(ROUTES.checkoutFor(['a'])).toBe('/checkout/a');
    expect(ROUTES.checkoutFor(['a', 'b'])).toBe('/checkout?ids=a,b');
  });
});
