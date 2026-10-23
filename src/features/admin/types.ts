import type { Event } from '@/features/events';
import type { Role } from '@/shared/session/roles';

// Cuerpo de POST /events
export interface CreateEventRequest {
  name: string;
  description: string;
  type: Event['type'];
  venue: string;
  price: number;
  capacity: number;
  startDate: string;
  endDate: string;
}

// Respuesta de POST /events/:id/cancel
export interface CancelEventResponse {
  id: string;
  status: Event['status'];
  cancelledReservations: number;
  cancelledTickets: number;
}

// Cuerpo de POST /users
export interface CreateUserRequest {
  email: string;
  password: string;
  role: Role;
}

export interface CreatedUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}
