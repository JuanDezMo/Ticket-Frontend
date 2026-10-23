import { useLocation, useMatch } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { isUuid } from './is-uuid';

// Una compra paga de 1 a 8 reservas del mismo evento
export const MAX_CHECKOUT_IDS = 8;
const IDS_PARAM = 'ids';

export interface CheckoutIds {
  ids: string[];
  // false si algún id no es un UUID, hay repetidos, o son más de 8 o ninguno
  valid: boolean;
}

/** Los ids que pide la ruta: uno en la ruta o varios en `?ids=a,b,c`. */
export function parseCheckoutIds(pathId: string | undefined, search: string): CheckoutIds {
  const raw =
    pathId !== undefined ? [pathId] : (new URLSearchParams(search).get(IDS_PARAM) ?? '').split(',');
  const valid =
    raw.length >= 1 &&
    raw.length <= MAX_CHECKOUT_IDS &&
    raw.every((id) => isUuid(id)) &&
    new Set(raw).size === raw.length;
  return { ids: raw, valid };
}

/** Los ids del checkout abierto, o null si la ubicación actual no es un checkout. */
export function useCheckoutIds(): CheckoutIds | null {
  const location = useLocation();
  const single = useMatch(ROUTES.checkoutPattern);
  const group = useMatch(ROUTES.checkoutGroup);
  if (single) return parseCheckoutIds(single.params.reservationId, '');
  if (group) return parseCheckoutIds(undefined, location.search);
  return null;
}
