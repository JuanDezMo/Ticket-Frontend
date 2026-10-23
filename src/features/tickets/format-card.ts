const GROUP_SIZE = 4;
const MAX_CARD_DIGITS = 19;
const EXPIRY_MONTH_DIGITS = 2;
const EXPIRY_DIGITS = 4;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** "4111111111111111" -> "4111 1111 1111 1111" mientras el usuario escribe. */
export function formatCardNumber(value: string): string {
  const digits = onlyDigits(value).slice(0, MAX_CARD_DIGITS);
  return digits.replace(new RegExp(`(\\d{${GROUP_SIZE}})(?=\\d)`, 'g'), '$1 ');
}

/** "1228" -> "12/28": agrega la barra después del mes. */
export function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, EXPIRY_DIGITS);
  return digits.length <= EXPIRY_MONTH_DIGITS
    ? digits
    : `${digits.slice(0, EXPIRY_MONTH_DIGITS)}/${digits.slice(EXPIRY_MONTH_DIGITS)}`;
}
