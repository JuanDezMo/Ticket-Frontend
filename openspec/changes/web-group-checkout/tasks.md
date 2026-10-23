## 1. Contrato, errores y datos de prueba

- [x] 1.1 `PurchaseRequest { reservationIds, card }`, `PurchaseResult { orderId, amount, tickets }`, `ticketsApi.purchase`, `usePurchase`; agregar `DUPLICATE_PAYMENT`, `PAYMENT_IN_PROGRESS`, `RESERVATIONS_MISMATCH` y `ORDER_AMOUNT_TOO_LARGE` a `ERROR_CODES` y a `ERROR_MESSAGES`; el mensaje del `504` pide esperar unos segundos. Verificar con `pnpm typecheck` y la prueba de `error-messages` (cada código tiene mensaje propio y el del `504` actualizado)
- [x] 1.2 Handler de MSW de `POST /tickets/purchase` con el contrato nuevo (lista, `201` siempre, `DUPLICATE_PAYMENT`, `RESERVATIONS_MISMATCH`, campo antiguo → `400`, un solo pedido) y helpers de prueba. Verificar con pruebas del handler: una reserva, tres reservas, una ya pagada, eventos distintos y el campo `reservationId` antiguo

## 2. Reservas del grupo

- [x] 2.1 `ROUTES.checkoutFor(ids)`, la ruta `/checkout` con `?ids=` y `useCheckoutIds()` (valida: UUID, sin repetidos, de 1 a 8). Verificar con pruebas unitarias: 1 y 8 ids válidos; 0, 9, repetido, no UUID y `ids` vacío son inválidos; ruta de una reserva y de grupo
- [x] 2.2 `useReservations(ids)` y `groupCheckout` (vigentes, no vigentes, total en centavos, la que vence primero, eventos distintos). Verificar con pruebas unitarias: todas activas, una vencida, todas pagadas, mezcla de cancelada y vencida, eventos distintos, y total sin errores de coma flotante

## 3. Checkout de grupo

- [x] 3.1 `CheckoutPage`/`PayView`: lista de seats, total, cuenta regresiva de la que vence primero, aviso de no vigentes con "Back to event", y el botón "Pay <total>". Verificar con pruebas de pantalla: una reserva (igual que antes), grupo de 2 y de 8, una no vigente, enlaces inválidos y visitante
- [x] 3.2 Pagar: `CardForm` y `PayView` envían una sola solicitud con las reservas vigentes; `201` quita todas del store e invalida seats y tickets; `TicketIssuedView` y `EndedView` para varios. Verificar con pruebas de pantalla: pago de 1 y de 3 reservas (una sola solicitud y el cuerpo), doble pulsación, confirmación de varios tickets con el total, y el store sin las reservas pagadas
- [x] 3.3 Resultados del pago (`purchase-errors` y `checkout-views`): `DUPLICATE_PAYMENT`, `PAYMENT_IN_PROGRESS` (conserva la tarjeta, sin "pago fallido"), `ORDER_AMOUNT_TOO_LARGE`, `RESERVATIONS_MISMATCH`, y `REFRESH_GROUP` para vencida/cancelada en un grupo. Verificar con pruebas por cada código, incluida una vencida dentro del grupo que deja pagar la otra con el total actualizado
- [x] 3.4 Bloqueo al vencer: cuenta regresiva del grupo con `timeUpFor`. Verificar con pruebas: vence la primera de dos y el pago se bloquea hasta que la API confirma y luego cobra solo la segunda; vencen todas y se muestra el estado vencido

## 4. Cancelar y enlaces

- [x] 4.1 `CancelReservation` con "Cancel all" y "Remove <label>" (confirmación, deshabilitados durante un pago, el seat quitado sale del enlace con `replace`, fallos parciales). Verificar con pruebas: quitar uno de tres, cancelar todo, no confirmar, una sola vigente sin "Remove", un fallo parcial y los botones deshabilitados durante el pago
- [x] 4.2 Enlaces de grupo: `useReserveSelection`, `SeatMap` y `HoldBanner` usan `ROUTES.checkoutFor` con las reservas del mismo evento que la primera en vencer; el aviso se oculta en un checkout que la incluye. Verificar con pruebas: reservar 1 y 3 seats (destino), aviso con reservas de dos eventos (solo las del primero) y ocultarse en el checkout del grupo

## 5. Documentación y cierre

- [x] 5.1 Actualizar `DESIGN.md` y `.impeccable/design.json` (checkout de grupo, lista de seats, confirmación de varios tickets) y `docs/api-integration.md` (compra por lista y errores nuevos). Verificar leyendo los archivos y con lint, tipos, arquitectura, formato y la suite completa
- [x] 5.2 Verificación contra `ticket-api` real y la pasarela: pagar 1 reserva y un grupo de 3 desde la UI (un cobro, 3 tickets, el mapa y "My tickets"), repetir el pago (`DUPLICATE_PAYMENT`), tarjeta rechazada (`...0000`) y quitar un seat antes de pagar. Verificar con las respuestas esperadas del backend
