import { z } from 'zod';

// Mismo criterio que ticket-api: un id que no es UUID nunca corresponde a un evento
const eventIdSchema = z.uuid();

export function isEventId(value: string | undefined): value is string {
  return eventIdSchema.safeParse(value).success;
}
