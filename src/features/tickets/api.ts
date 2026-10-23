import { http } from '@/shared/api/http-client';
import type { IssuedTicket, MyTicketPage, MyTicketsQuery, PurchaseRequest } from './types';

export const ticketsApi = {
  purchase: (request: PurchaseRequest) =>
    http.post<IssuedTicket>('/tickets/purchase', { body: request }),
  listMine: (query: MyTicketsQuery) =>
    http.get<MyTicketPage>('/tickets/me', { query: { ...query } }),
};
