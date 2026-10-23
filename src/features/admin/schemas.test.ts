import { createUserSchema, eventFormSchema, toCreateEventRequest } from './schemas';

const HOUR_MS = 60 * 60 * 1000;
const inHours = (hours: number) => new Date(Date.now() + hours * HOUR_MS);

const valid = {
  name: ' Rock Night ',
  description: 'Live music',
  type: 'CONCERT',
  venue: 'Main Hall',
  price: '49.99',
  capacity: '25',
  startDate: inHours(48),
  endDate: inHours(51),
};

function errorsFor(overrides: Record<string, unknown>): Record<string, string> {
  const result = eventFormSchema.safeParse({ ...valid, ...overrides });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
  );
}

describe('eventFormSchema', () => {
  it('accepts a valid event', () => {
    expect(eventFormSchema.safeParse(valid).success).toBe(true);
  });

  it('requires name, description and venue', () => {
    expect(errorsFor({ name: '  ', description: '', venue: '' })).toEqual({
      name: 'Name is required',
      description: 'Description is required',
      venue: 'Venue is required',
    });
  });

  it('requires a type', () => {
    expect(errorsFor({ type: undefined }).type).toBe('Choose an event type');
    expect(errorsFor({ type: 'PARTY' }).type).toBe('Choose an event type');
  });

  it.each(['0', '-5', '', 'abc'])('rejects the price "%s"', (price) => {
    expect(errorsFor({ price }).price).toBe('Price must be greater than 0');
  });

  it.each(['0', '261', '300', '2.5', '', 'abc'])('rejects the capacity "%s"', (capacity) => {
    expect(errorsFor({ capacity }).capacity).toBe('Capacity must be a whole number from 1 to 260');
  });

  it.each(['1', '260'])('accepts the capacity "%s"', (capacity) => {
    expect(errorsFor({ capacity }).capacity).toBeUndefined();
  });

  it('rejects a start in the past', () => {
    expect(errorsFor({ startDate: inHours(-1), endDate: inHours(2) }).startDate).toBe(
      'Start must be in the future',
    );
  });

  it('rejects an end before the start', () => {
    expect(errorsFor({ endDate: inHours(24) }).endDate).toBe('End must be after start');
  });

  it('asks for both dates', () => {
    expect(errorsFor({ startDate: undefined, endDate: undefined })).toMatchObject({
      startDate: 'Choose a start date',
      endDate: 'Choose an end date',
    });
  });
});

describe('toCreateEventRequest', () => {
  it('converts numbers, trims text and sends the dates in UTC', () => {
    const values = eventFormSchema.parse(valid);
    const request = toCreateEventRequest(values);

    expect(request).toEqual({
      name: 'Rock Night',
      description: 'Live music',
      type: 'CONCERT',
      venue: 'Main Hall',
      price: 49.99,
      capacity: 25,
      startDate: valid.startDate.toISOString(),
      endDate: valid.endDate.toISOString(),
    });
    expect(request.startDate).toMatch(/Z$/);
  });
});

describe('createUserSchema', () => {
  const user = { email: 'boss@mail.com', password: 'secret123', role: 'ADMIN' };

  it('accepts a valid user', () => {
    expect(createUserSchema.safeParse(user).success).toBe(true);
  });

  it('rejects a bad email, a short password and a missing role', () => {
    const result = createUserSchema.safeParse({
      email: 'nope',
      password: '1234567',
      role: undefined,
    });
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual([
      'Enter a valid email',
      'Password must be at least 8 characters',
      'Choose a role',
    ]);
  });

  it('accepts exactly 8 and 128 characters', () => {
    expect(createUserSchema.safeParse({ ...user, password: '12345678' }).success).toBe(true);
    expect(createUserSchema.safeParse({ ...user, password: 'x'.repeat(128) }).success).toBe(true);
    expect(createUserSchema.safeParse({ ...user, password: 'x'.repeat(129) }).success).toBe(false);
  });
});
