import type { Event } from '@/features/events';
import { http } from '@/shared/api/http-client';
import type {
  CancelEventResponse,
  CreatedUser,
  CreateEventRequest,
  CreateUserRequest,
} from './types';

export const adminApi = {
  createEvent: (request: CreateEventRequest) => http.post<Event>('/events', { body: request }),
  cancelEvent: (id: string) => http.post<CancelEventResponse>(`/events/${id}/cancel`),
  createUser: (request: CreateUserRequest) => http.post<CreatedUser>('/users', { body: request }),
};
