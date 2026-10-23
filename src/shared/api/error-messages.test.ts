import { ApiError, ERROR_CODES } from './api-error';
import { GENERIC_ERROR_MESSAGE, getErrorMessage } from './error-messages';

describe('getErrorMessage', () => {
  it('returns the message defined for a known code', () => {
    const error = new ApiError(409, ERROR_CODES.EMAIL_ALREADY_EXISTS, 'Email already exists');
    expect(getErrorMessage(error)).toBe('An account with this email already exists');
  });

  it('returns the generic message for an unknown code', () => {
    expect(getErrorMessage(new ApiError(418, 'SOMETHING_NEW', 'x'))).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('returns the generic message for INTERNAL_ERROR', () => {
    const error = new ApiError(500, ERROR_CODES.INTERNAL_ERROR, 'Internal server error');
    expect(getErrorMessage(error)).toBe('Something went wrong. Please try again');
  });

  it('returns the connection message for NETWORK_ERROR', () => {
    expect(getErrorMessage(new ApiError(0, ERROR_CODES.NETWORK_ERROR, ''))).toBe(
      'Cannot reach the server. Check your connection and try again',
    );
  });

  it('returns the generic message for errors that are not ApiError', () => {
    expect(getErrorMessage(new Error('boom'))).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('has a specific message for the payment and reservation codes', () => {
    const codes = [
      ERROR_CODES.PAYMENT_REJECTED,
      ERROR_CODES.CARD_PROBLEM,
      ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      ERROR_CODES.PAYMENT_GATEWAY_TIMEOUT,
      ERROR_CODES.RESERVATION_EXPIRED,
      ERROR_CODES.EVENT_CANCELLED,
      ERROR_CODES.RESERVATION_NOT_FOUND,
      ERROR_CODES.RESERVATION_ALREADY_CANCELLED,
      ERROR_CODES.RESERVATION_ALREADY_CONFIRMED,
      ERROR_CODES.SEAT_NOT_AVAILABLE,
      ERROR_CODES.SEAT_LIMIT_REACHED,
      ERROR_CODES.HOLD_LIMIT_REACHED,
      ERROR_CODES.EVENT_NOT_ACTIVE,
    ];
    for (const code of codes) {
      expect(getErrorMessage(new ApiError(409, code, 'x'))).not.toBe(GENERIC_ERROR_MESSAGE);
    }
  });

  it('tells the user that retrying a timed out payment is safe', () => {
    const error = new ApiError(504, ERROR_CODES.PAYMENT_GATEWAY_TIMEOUT, 'timeout');
    expect(getErrorMessage(error)).toBe(
      'Payment service timed out. Please try again. You will not be charged twice',
    );
  });
});
