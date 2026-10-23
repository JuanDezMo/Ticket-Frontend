## Why

Hoy un comprador llega hasta elegir un seat y el botón "Reserve" está deshabilitado: la UI no puede vender. Esta iteración cierra el flujo central del producto, de "elegí mi seat" a "tengo mi ticket", y es la razón de ser de `PRODUCT.md`: que el comprador sepa en todo momento cuánto tiempo le queda y qué hacer si el pago falla. `ticket-api` ya lo soporta: reservar, consultar y cancelar una reserva, comprar con tarjeta y listar los tickets propios.

## What Changes

- **Reservar:** "Reserve" se habilita. Crea la reserva del seat elegido, guarda la reserva en curso y lleva al checkout.
- **Reserva en curso recordada:** sobrevive a una recarga (`sessionStorage`), se valida contra la API al volver, y un aviso fijo debajo del encabezado ("Seat C7 is held · 07:42 left · Continue to checkout") sigue al usuario por la aplicación. Una sola reserva a la vez.
- **Cuenta regresiva real:** minutos y segundos hasta `expiresAt` y la regla de 10 tramos, que se consume según el tiempo restante.
- **Checkout** en `/checkout/:reservationId`: resumen de la compra, formulario de tarjeta (franquicia, número, vencimiento y CVV), pago con una sola solicitud y sin reintentos automáticos.
- **Cada respuesta de pago tiene su salida:** rechazado (otra tarjeta), tarjeta con problemas (otro medio de pago), error temporal o tiempo agotado (reintentar a mano), datos inválidos (errores en los campos), reserva vencida, evento cancelado o reserva ya cancelada.
- **Cancelar la reserva** con confirmación; se bloquea mientras haya un pago en curso.
- **Ticket emitido:** pantalla de confirmación con el seat, el evento y el monto.
- **Mis tickets** en `/my-tickets`: lista paginada de los tickets del usuario, con los de eventos cancelados marcados.
- Los datos de la tarjeta viven solo en el formulario: nunca se guardan en el navegador ni en la caché de consultas.

## Fuera de alcance

- Reembolsos (`REFUND_PENDING` es solo una marca del backend).
- Varias reservas a la vez ni comprar varios seats en una sola operación.
- QR, correo de confirmación y descarga de tickets.
- Detalle individual de un ticket (la API solo tiene `GET /tickets/me`).
- Guardar tarjetas o pagar con otros medios.
- Panel de admin (`web-admin`) y pruebas E2E (`web-hardening`).
- Cambios en `ticket-api`.

## Capabilities

### New Capabilities

- `seat-reservation`: reservar un seat, una reserva en curso recordada y visible en toda la app, cuenta regresiva y cancelación.
- `ticket-checkout`: pantalla de pago, formulario de tarjeta, respuesta a cada resultado del pago y confirmación del ticket.
- `my-tickets`: lista paginada de los tickets del usuario.

### Modified Capabilities

- `seat-map-presentation`: el botón "Reserve" del pase deja de estar deshabilitado.

## Impact

- **Código nuevo:** `src/features/reservations/` (datos, store, cuenta regresiva y aviso) y `src/features/tickets/` (checkout, tarjeta y mis tickets).
- **Código existente:** `SelectionPass` y `SeatMap` (reservar), `AppLayout` (aviso), `routes.tsx` (dos rutas), `providers.tsx` (limpiar la reserva al cerrar sesión), `Pagination` pasa a `shared/ui` para que la usen eventos y tickets.
- **Dependencia nueva de UI:** el `alert-dialog` de shadcn.
- **API:** `POST /reservations`, `GET /reservations/:id`, `POST /reservations/:id/cancel`, `POST /tickets/purchase` y `GET /tickets/me`; ya están en `ticket-api`.
- **Seguridad:** ningún dato de tarjeta se guarda, se registra ni viaja en la URL. El mapa de seats y la compra ya exigen sesión.
- **Pruebas:** el servidor simulado gana las rutas de reservas y compras; la cuenta regresiva se prueba con relojes falsos.
