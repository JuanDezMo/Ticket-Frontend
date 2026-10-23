import { z } from 'zod';
import { CARD_BRAND_VALUES, type CardPayload } from './types';
import { onlyDigits } from './format-card';

// Mismos límites que la pasarela: así un error de formato no consume intentos
const MIN_CARD_DIGITS = 13;
const MAX_CARD_DIGITS = 19;
const CVV_DIGITS = 3;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/(\d{2})$/;
const CENTURY = 2000;

function isNotExpired(expiry: string, now: Date): boolean {
  const match = EXPIRY_PATTERN.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  const year = CENTURY + Number(match[2]);
  // La tarjeta vale hasta el final del mes de vencimiento
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export const cardSchema = z.object({
  brand: z.enum(CARD_BRAND_VALUES, { error: 'Choose a card brand' }),
  number: z.string().refine((value) => {
    const length = onlyDigits(value).length;
    return /^[\d ]+$/.test(value) && length >= MIN_CARD_DIGITS && length <= MAX_CARD_DIGITS;
  }, `Enter a card number of ${MIN_CARD_DIGITS} to ${MAX_CARD_DIGITS} digits`),
  expiry: z
    .string()
    .regex(EXPIRY_PATTERN, 'Use the MM/YY format')
    .refine((value) => isNotExpired(value, new Date()), 'This card has expired'),
  cvv: z.string().regex(new RegExp(`^\\d{${CVV_DIGITS}}$`), `Enter the ${CVV_DIGITS}-digit code`),
});

export type CardValues = z.infer<typeof cardSchema>;

/** Lo que viaja a la API: el número sin espacios. */
export function toCardPayload(values: CardValues): CardPayload {
  return { ...values, number: onlyDigits(values.number) };
}
