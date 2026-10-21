import { http } from '@/shared/api/http-client';
import type { Credentials, LoginResponse, RegisteredUser } from './types';

export const authApi = {
  register: (credentials: Credentials) =>
    http.post<RegisteredUser>('/auth/register', { body: credentials }),
  login: (credentials: Credentials) =>
    http.post<LoginResponse>('/auth/login', { body: credentials }),
};
