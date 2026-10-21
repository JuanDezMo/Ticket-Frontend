import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api-error';
import { getErrorMessage } from './error-messages';

export const FORM_ERROR_KEY = 'root.server';

/**
 * Muestra un error de la API en el formulario: en el campo indicado por `fieldByCode`
 * o, si el código no tiene campo, como error general del formulario.
 */
export function setFormApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldByCode: Partial<Record<string, Path<T>>> = {},
): void {
  const field = error instanceof ApiError ? fieldByCode[error.code] : undefined;
  setError(field ?? FORM_ERROR_KEY, { message: getErrorMessage(error) });
}
