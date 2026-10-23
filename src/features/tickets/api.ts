import { http } from '@/shared/api/http-client';
import type { MyTicketPage, MyTicketsQuery, PurchaseRequest, PurchaseResult } from './types';

export const ticketsApi = {
  purchase: (request: PurchaseRequest) =>
    http.post<PurchaseResult>('/tickets/purchase', { body: request }),
  listMine: (query: MyTicketsQuery) =>
    http.get<MyTicketPage>('/tickets/me', { query: { ...query } }),
};
