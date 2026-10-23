import { cardSchema, toCardPayload } from './card.schemas';
import { formatCardNumber, formatExpiry } from './format-card';

const valid = { brand: 'VISA', number: '4111111111111111', expiry: '12/99', cvv: '123' };

function messageFor(overrides: Record<string, unknown>) {
  const result = cardSchema.safeParse({ ...valid, ...overrides });
  return result.success ? null : result.error.issues[0]?.message;
}

describe('cardSchema', () => {
  it('accepts a valid card', () => {
    expect(cardSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a 10 digit number', () => {
    expect(messageFor({ number: '4111111111' })).toBe('Enter a card number of 13 to 19 digits');
  });

  it('accepts spaces in the number', () => {
    expect(cardSchema.safeParse({ ...valid, number: '4111 1111 1111 1111' }).success).toBe(true);
  });

  it('rejects letters in the number', () => {
    expect(messageFor({ number: '4111-1111-1111-1111' })).toBeTruthy();
  });

  it('rejects an expiry in the past', () => {
    expect(messageFor({ expiry: '01/20' })).toBe('This card has expired');
  });

  it('rejects a malformed expiry', () => {
    expect(messageFor({ expiry: '13/30' })).toBe('Use the MM/YY format');
    expect(messageFor({ expiry: '1230' })).toBe('Use the MM/YY format');
  });

  it('accepts the current month', () => {
    const now = new Date();
    const expiry = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(2)}`;
    expect(cardSchema.safeParse({ ...valid, expiry }).success).toBe(true);
  });

  it('rejects a 2 digit CVV', () => {
    expect(messageFor({ cvv: '12' })).toBe('Enter the 3-digit code');
  });

  it('rejects an empty or unknown brand', () => {
    expect(messageFor({ brand: '' })).toBe('Choose a card brand');
    expect(messageFor({ brand: 'DISCOVER' })).toBe('Choose a card brand');
  });
});

describe('toCardPayload', () => {
  it('sends only the digits of the number', () => {
    const values = cardSchema.parse({ ...valid, number: '4111 1111 1111 1111' });
    expect(toCardPayload(values).number).toBe('4111111111111111');
  });
});

describe('card formatting', () => {
  it('groups the number in fours', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(formatCardNumber('41111')).toBe('4111 1');
  });

  it('adds the slash after the month', () => {
    expect(formatExpiry('1228')).toBe('12/28');
    expect(formatExpiry('12')).toBe('12');
  });
});
