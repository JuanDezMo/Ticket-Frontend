import type { PageMeta } from '@/shared/api/page-meta';

export const TICKET_STATUSES = {
  ISSUED: 'ISSUED',
  // El organizador canceló el evento
  CANCELLED_BY_EVENT: 'CANCELLED_BY_EVENT',
} as const;
export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const CARD_BRANDS = {
  VISA: 'VISA',
  MASTERCARD: 'MASTERCARD',
  AMEX: 'AMEX',
} as const;
export type CardBrand = (typeof CARD_BRANDS)[keyof typeof CARD_BRANDS];
export const CARD_BRAND_VALUES = Object.values(CARD_BRANDS) as [CardBrand, ...CardBrand[]];

// Cuerpo de POST /tickets/purchase; nunca se guarda fuera del formulario
export interface CardPayload {
  brand: CardBrand;
  number: string;
  expiry: string;
  cvv: string;
}

export interface PurchaseRequest {
  // De 1 a 8 reservas del mismo evento; el monto lo calcula el servidor
  reservationIds: string[];
  card: CardPayload;
}

// Un ticket de la respuesta de POST /tickets/purchase
export interface IssuedTicket {
  id: string;
  reservationId: string;
  eventId: string;
  seat: string;
  status: TicketStatus;
  amount: number;
  transactionId: string;
  issuedAt: string;
}

// Respuesta de POST /tickets/purchase: siempre 201, un ticket por reserva en el orden pedido
export interface PurchaseResult {
  orderId: string;
  amount: number;
  tickets: IssuedTicket[];
}

export interface TicketEvent {
  id: string;
  name: string;
  venue: string;
  startDate: string;
}

// Elemento de GET /tickets/me
export interface MyTicket {
  id: string;
  status: TicketStatus;
  seat: string;
  amount: number;
  issuedAt: string;
  event: TicketEvent;
}

export interface MyTicketPage {
  data: MyTicket[];
  meta: PageMeta;
}

export interface MyTicketsQuery {
  page: number;
  pageSize: number;
}
