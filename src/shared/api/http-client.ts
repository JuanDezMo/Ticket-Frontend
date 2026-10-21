import { env } from '@/shared/config/env';
import { useSessionStore } from '@/shared/session/session.store';
import { ApiError, ERROR_CODES } from './api-error';

type QueryValue = string | number | boolean | undefined;

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
}

const UNAUTHORIZED_STATUS = 401;

// En estas rutas un 401 significa credenciales inválidas, no una sesión vencida
const CREDENTIAL_PATHS = ['/auth/login'];

function buildUrl(path: string, query: RequestOptions['query']): string {
  // La base puede ser relativa (/api) o absoluta; se resuelve contra el origen actual
  const url = new URL(`${env.apiBaseUrl}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toApiError(status: number, data: unknown): ApiError {
  if (data && typeof data === 'object' && 'code' in data && typeof data.code === 'string') {
    const message = 'message' in data && typeof data.message === 'string' ? data.message : '';
    return new ApiError(status, data.code, message);
  }
  return new ApiError(status, ERROR_CODES.UNKNOWN, 'Unexpected response from the server');
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = useSessionStore.getState().token;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, ERROR_CODES.NETWORK_ERROR, 'Network error');
  }

  const data = await readJson(response);
  if (!response.ok) {
    if (response.status === UNAUTHORIZED_STATUS && token && !CREDENTIAL_PATHS.includes(path)) {
      useSessionStore.getState().expire();
    }
    throw toApiError(response.status, data);
  }
  return data as T;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
};
