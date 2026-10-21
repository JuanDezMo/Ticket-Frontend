import type { Role } from '@/shared/session/roles';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
