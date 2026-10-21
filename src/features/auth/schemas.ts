import { z } from 'zod';

// Mismos límites que ticket-api
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const emailSchema = z.string().trim().pipe(z.email('Enter a valid email'));

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`),
});

// En el login solo se exige que la contraseña no esté vacía, como hace la API
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(MAX_PASSWORD_LENGTH),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
