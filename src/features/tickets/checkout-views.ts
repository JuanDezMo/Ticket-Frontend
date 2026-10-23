import { RESERVATION_STATUSES, type ReservationStatus } from '@/features/reservations';
import { PURCHASE_ACTIONS, type PurchaseAction } from './purchase-errors';

// Pantallas del checkout que reemplazan al formulario de pago
export const ENDED_KINDS = {
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  PAID: 'PAID',
  NOT_FOUND: 'NOT_FOUND',
} as const;
export type EndedKind = (typeof ENDED_KINDS)[keyof typeof ENDED_KINDS];

// Solo una reserva ACTIVE se puede pagar (null = mostrar el formulario)
export const ENDED_BY_STATUS: Record<ReservationStatus, EndedKind | null> = {
  [RESERVATION_STATUSES.ACTIVE]: null,
  [RESERVATION_STATUSES.EXPIRED]: ENDED_KINDS.EXPIRED,
  [RESERVATION_STATUSES.CANCELLED]: ENDED_KINDS.CANCELLED,
  [RESERVATION_STATUSES.CANCELLED_BY_USER]: ENDED_KINDS.CANCELLED,
  [RESERVATION_STATUSES.CONFIRMED]: ENDED_KINDS.PAID,
};

// Respuestas de la compra que terminan la reserva
export const ENDED_BY_ACTION: Partial<Record<PurchaseAction, EndedKind>> = {
  [PURCHASE_ACTIONS.SHOW_EXPIRED]: ENDED_KINDS.EXPIRED,
  [PURCHASE_ACTIONS.SHOW_CANCELLED]: ENDED_KINDS.CANCELLED,
  [PURCHASE_ACTIONS.SHOW_EVENT_CANCELLED]: ENDED_KINDS.EVENT_CANCELLED,
  [PURCHASE_ACTIONS.SHOW_PAID]: ENDED_KINDS.PAID,
  [PURCHASE_ACTIONS.SHOW_NOT_FOUND]: ENDED_KINDS.NOT_FOUND,
};
