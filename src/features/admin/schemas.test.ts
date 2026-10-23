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
  maxSeatsPerUser: '4',
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

describe('eventFormSchema max seats per buyer', () => {
  it.each(['1', '8'])('accepts the limit "%s"', (maxSeatsPerUser) => {
    expect(errorsFor({ maxSeatsPerUser }).maxSeatsPerUser).toBeUndefined();
  });

  it.each(['0', '9', '2.5', 'abc', '-1'])('rejects the limit "%s"', (maxSeatsPerUser) => {
    expect(errorsFor({ maxSeatsPerUser }).maxSeatsPerUser).toBe(
      'Max seats per buyer must be a whole number from 1 to 8',
    );
  });

  it('requires a value', () => {
    expect(errorsFor({ maxSeatsPerUser: '' }).maxSeatsPerUser).toBe(
      'Max seats per buyer is required',
    );
    expect(errorsFor({ maxSeatsPerUser: '  ' }).maxSeatsPerUser).toBe(
      'Max seats per buyer is required',
    );
  });

  it('cannot exceed the capacity', () => {
    const message = 'Max seats per buyer cannot exceed the capacity';
    expect(errorsFor({ capacity: '4', maxSeatsPerUser: '5' }).maxSeatsPerUser).toBe(message);
    expect(errorsFor({ capacity: '4', maxSeatsPerUser: '4' }).maxSeatsPerUser).toBeUndefined();
    expect(errorsFor({ capacity: '1', maxSeatsPerUser: '1' }).maxSeatsPerUser).toBeUndefined();
  });

  it('does not add the capacity error while the capacity itself is invalid', () => {
    const errors = errorsFor({ capacity: 'abc', maxSeatsPerUser: '5' });
    expect(errors.capacity).toBeDefined();
    expect(errors.maxSeatsPerUser).toBeUndefined();
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
      maxSeatsPerUser: 4,
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
