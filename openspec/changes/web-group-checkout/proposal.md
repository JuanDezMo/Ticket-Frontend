## Why

`ticket-api` ya no acepta `reservationId` en `POST /tickets/purchase`: recibe `reservationIds` y responde `{ orderId, amount, tickets }`. El checkout actual, que paga una reserva con el contrato antiguo, **no funciona contra el backend nuevo**. Además, con varias reservas activas (`web-multi-seat-hold`) el comprador debe pagarlas **juntas, una sola vez**: pagar una por una obligaría a escribir la tarjeta N veces y arriesgaría perder seats al vencer el tiempo.

## What Changes

- **Checkout de grupo:** la pantalla de pago resume todos los seats del grupo, el total y el tiempo de la primera en vencer, con un solo formulario de tarjeta. La ruta de una reserva (`/checkout/:reservationId`) se mantiene y se agrega la de grupo (`/checkout?ids=a,b,c`, de 1 a 8 ids).
- **Una compra para todos:** envía `reservationIds` a `POST /tickets/purchase` y recibe N tickets en una sola respuesta `201`.
- **Ticket emitido:** la confirmación lista todos los seats y el total pagado. Repetir una compra ya pagada ya no devuelve `200`: es `409 DUPLICATE_PAYMENT` y se trata como "ya pagada".
- **Pago en curso en el servidor:** `409 PAYMENT_IN_PROGRESS` (doble pulsación, dos pestañas, o reintento antes de 30 s tras un `504`) conserva los datos de la tarjeta y pide esperar unos segundos; no es un pago fallido ni duplicado. El mensaje del `504` pasa a decir que se espere unos segundos.
- **Vencimiento dentro del grupo:** la API **no dice cuál** reserva venció (`RESERVATION_EXPIRED` no nombra ninguna). La UI consulta cada reserva, avisa cuáles ya no están vigentes y ofrece pagar las que siguen vigentes o volver al evento. El pago se bloquea mientras la API no confirme el estado del grupo.
- **Cancelar:** se puede quitar un seat del grupo (cancela solo su reserva) o cancelar todo, con confirmación; sigue bloqueado durante un pago.
- **Enlaces de grupo:** tras reservar, "Continue to checkout" del aviso y del pase llevan al checkout de las reservas del mismo evento.
- Errores nuevos con mensaje propio: `DUPLICATE_PAYMENT`, `PAYMENT_IN_PROGRESS`, `RESERVATIONS_MISMATCH` y `ORDER_AMOUNT_TOO_LARGE`.

## Fuera de alcance

- Pagar reservas de distintos eventos (la API responde `RESERVATIONS_MISMATCH`; la UI nunca lo arma).
- Pago parcial dentro del grupo: se paga todo lo vigente o nada.
- Dividir el pago entre tarjetas.
- "My tickets" no cambia: cada seat sigue siendo un ticket.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `ticket-checkout`: el checkout paga varias reservas y confirma varios tickets; nuevos resultados del pago; reservas del grupo que ya no están vigentes; quitar un seat.
- `seat-reservation`: el destino de "Continue to checkout" y de la reserva exitosa, y cancelar un seat del grupo o el grupo completo.

## Impact

- **Código:** `features/tickets` (`CheckoutPage`, `PayView`, `TicketIssuedView`, `EndedView`, `CancelReservation`, `CardForm`, `api`, `hooks`, `types`, `purchase-errors`, `checkout-views`), `features/reservations` (`HoldBanner`), `features/seats` (destino tras reservar), rutas y `shared/config/routes.ts`, tabla de errores, MSW y pruebas.
- **API:** nueva forma de `POST /tickets/purchase` (lista de reservas y lista de tickets).
- **Esfuerzo estimado:** 3 a 4 días con pruebas.
- **Depende de:** `web-multi-seat-hold` (archivado) y `group-purchase` en `ticket-api`.
