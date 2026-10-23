import { z } from 'zod';

// Mismo criterio que ticket-api: un id que no es UUID nunca corresponde a un recurso
const uuidSchema = z.uuid();

export function isUuid(value: string | undefined): value is string {
  return uuidSchema.safeParse(value).success;
}
