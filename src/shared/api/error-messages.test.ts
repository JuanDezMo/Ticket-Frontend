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
});
