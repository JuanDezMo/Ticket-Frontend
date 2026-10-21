import { loginSchema, registerSchema } from './schemas';

describe('registerSchema', () => {
  it('accepts a valid email and password, trimming the email', () => {
    const result = registerSchema.parse({ email: ' ana@mail.com ', password: 'secret123' });
    expect(result.email).toBe('ana@mail.com');
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ email: 'ana', password: 'secret123' });
    expect(result.error?.issues[0]?.message).toBe('Enter a valid email');
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ email: 'ana@mail.com', password: 'short' });
    expect(result.error?.issues[0]?.message).toBe('Password must be at least 8 characters');
  });

  it('rejects a password longer than 128 characters', () => {
    const result = registerSchema.safeParse({ email: 'ana@mail.com', password: 'a'.repeat(129) });
    expect(result.error?.issues[0]?.message).toBe('Password must be at most 128 characters');
  });
});

describe('loginSchema', () => {
  it('only requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'ana@mail.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'ana@mail.com', password: '' }).success).toBe(false);
  });
});
