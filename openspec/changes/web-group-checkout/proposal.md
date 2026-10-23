## Why

Con varias reservas activas, el comprador debe pagarlas **juntas, una sola vez**. Hoy el checkout recibe una reserva (`/checkout/:reservationId`) y muestra un ticket. Pagar uno por uno obligaría a escribir la tarjeta N veces y arriesgaría perder seats al vencer el tiempo.

## What Changes

- **Checkout de grupo:** la pantalla de pago resume todos los seats reservados, el total y el tiempo del primero en vencer, con un solo formulario de tarjeta.
- **Una compra para todos:** envía `reservationIds` a `POST /tickets/purchase` (change `group-purchase` en `ticket-api`) y recibe N tickets.
- **Ticket emitido:** la confirmación lista todos los seats y el monto total. Los demás resultados del pago se tratan igual que hoy, aplicados al grupo.
- **Vencimiento:** si una reserva del grupo vence, se avisa cuál y se ofrece pagar las que siguen vigentes o volver al evento. El pago se bloquea mientras la API no confirme el estado del grupo.
- **Cancelar:** se puede quitar un seat del grupo (cancela su reserva) o cancelar todo, con confirmación; sigue bloqueado durante un pago.
- La ruta se mantiene con una reserva sola (`/checkout/:reservationId`) y se agrega la de grupo (`/checkout?ids=...`).
- "My tickets" muestra cada seat como un ticket, sin cambios de formato.

## Fuera de alcance

- Pagar reservas de distintos eventos.
- Pago parcial dentro del grupo.
- Dividir el pago entre tarjetas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `ticket-checkout`: el checkout paga varias reservas y confirma varios tickets.
- `seat-reservation`: cancelar un seat del grupo o el grupo completo.

## Impact

- **Código:** `features/tickets` (`CheckoutPage`, `PayView`, `TicketIssuedView`, `CancelReservation`, `api.ts`, `purchase-errors`), `features/reservations` (cuenta regresiva del grupo) y rutas.
- **API:** nueva forma de `POST /tickets/purchase` (lista de reservas y lista de tickets en la respuesta).
- **Esfuerzo estimado:** 3 a 4 días con pruebas.
- **Depende de:** `web-multi-seat-hold` y `group-purchase` en `ticket-api`.
