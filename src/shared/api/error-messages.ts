import { ApiError, isErrorCode, type ErrorCode } from './api-error';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again';

// Un código nuevo es una entrada más en esta tabla
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Some fields are invalid. Please review them and try again',
  CARD_BRAND_REQUIRED: 'Card brand is required. Use VISA, MASTERCARD or AMEX',
  CARD_BRAND_NOT_ALLOWED: 'Card brand not allowed. Use VISA, MASTERCARD or AMEX',
  UNAUTHORIZED: 'Your session has expired. Please sign in again',
  INVALID_CREDENTIALS: 'Invalid email or password',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  RESERVATION_NOT_FOUND: 'Reservation not found',
  EVENT_NOT_FOUND: 'Event not found',
  SEAT_NOT_FOUND: 'Seat not found',
  SEAT_NOT_AVAILABLE: 'This seat is no longer available. Please choose another one',
  EVENT_ALREADY_CANCELLED: 'This event is already cancelled',
  EVENT_ALREADY_ENDED: 'This event has already ended',
  EVENT_NOT_ACTIVE: 'This event is no longer available for booking',
  RESERVATION_EXPIRED: 'Your reservation has expired. Please choose a seat again',
  EVENT_CANCELLED: 'This event has been cancelled',
  PAYMENT_REJECTED: 'Payment was rejected. Please try another card',
  CARD_PROBLEM: 'The card has problems. Please use another payment method',
  PAYMENT_GATEWAY_ERROR: 'Payment service error. Please try again',
  PAYMENT_GATEWAY_TIMEOUT: 'Payment service timed out. Please try again',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  INTERNAL_ERROR: GENERIC_ERROR_MESSAGE,
  UNKNOWN: GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR: 'Cannot reach the server. Check your connection and try again',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && isErrorCode(error.code)) {
    return ERROR_MESSAGES[error.code];
  }
  return GENERIC_ERROR_MESSAGE;
}
