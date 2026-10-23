import { z } from 'zod';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/features/auth';
import { EVENT_TYPE_VALUES } from '@/features/events';
import { MAX_PREVIEW_CAPACITY, MIN_PREVIEW_CAPACITY } from '@/features/seats';
import { ROLES } from '@/shared/session/roles';
import type { CreateEventRequest } from './types';

const required = (message: string) => z.string().trim().min(1, message);

const isPositiveNumber = (value: string) => value.trim() !== '' && Number(value) > 0;
const isCapacity = (value: string) => {
  const capacity = Number(value);
  return (
    /^\d+$/.test(value.trim()) &&
    capacity >= MIN_PREVIEW_CAPACITY &&
    capacity <= MAX_PREVIEW_CAPACITY
  );
};

// Mismas reglas que ticket-api: los mensajes salen en el campo que falla
export const eventFormSchema = z
  .object({
    name: required('Name is required'),
    description: required('Description is required'),
    type: z.enum(EVENT_TYPE_VALUES, { error: 'Choose an event type' }),
    venue: required('Venue is required'),
    // Los números viven como texto en el formulario y se convierten al enviar
    price: z.string().refine(isPositiveNumber, 'Price must be greater than 0'),
    capacity: z
      .string()
      .refine(
        isCapacity,
        `Capacity must be a whole number from ${MIN_PREVIEW_CAPACITY} to ${MAX_PREVIEW_CAPACITY}`,
      ),
    startDate: z
      .date({ error: 'Choose a start date' })
      .refine((date) => date.getTime() > Date.now(), 'Start must be in the future'),
    endDate: z.date({ error: 'Choose an end date' }),
  })
  .refine((values) => values.endDate.getTime() > values.startDate.getTime(), {
    path: ['endDate'],
    message: 'End must be after start',
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

/** Lo que viaja a la API: números y fechas en UTC. */
export function toCreateEventRequest(values: EventFormValues): CreateEventRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    type: values.type,
    venue: values.venue.trim(),
    price: Number(values.price),
    capacity: Number(values.capacity),
    startDate: values.startDate.toISOString(),
    endDate: values.endDate.toISOString(),
  };
}

const ROLE_OPTIONS = [ROLES.USER, ROLES.ADMIN] as const;

export const createUserSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email')),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`),
  role: z.enum(ROLE_OPTIONS, { error: 'Choose a role' }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
