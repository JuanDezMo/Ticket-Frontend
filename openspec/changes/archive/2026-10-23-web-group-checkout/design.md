## Context

- **Backend ya cambiado:** `POST /tickets/purchase` recibe `{ reservationIds: [1 a 8], card }` y responde siempre `201 { orderId, amount, tickets: [...] }` (un ticket por reserva, en el orden pedido). Repetir una compra pagada es `409 DUPLICATE_PAYMENT`; si otra solicitud ya cobra alguna reserva (o hay un reintento antes de 30 s tras un `504`), `409 PAYMENT_IN_PROGRESS` sin cobrar. Errores nuevos: `400 RESERVATIONS_MISMATCH` y `400 ORDER_AMOUNT_TOO_LARGE`. El monto lo calcula el servidor.
- **Los errores no nombran la reserva culpable:** `RESERVATION_EXPIRED`, `RESERVATION_ALREADY_CANCELLED` o `DUPLICATE_PAYMENT` no dicen cuál; hay que consultar cada reserva (`GET /reservations/:id`).
- **Frontend actual:** `CheckoutPage` lee una reserva de `:reservationId`; `PayView`, `CardForm`, `usePurchase`, `TicketIssuedView`, `EndedView` y `CancelReservation` asumen una. `purchase-errors` y `checkout-views` mapean cada código a una acción y a una vista. La ruta de grupo no existe. Tras `web-multi-seat-hold`, el pase y el aviso enlazan al checkout de una reserva.
- Capas: `tickets` importa de `reservations`, `events` y `seats` por su `index.ts`; `reservations` no importa de `tickets`.

## Goals / Non-Goals

**Goals:**
- Que pagar funcione contra el backend nuevo, con una o varias reservas, en un solo cobro.
- Que el comprador entienda qué pasa cuando una reserva del grupo vence, y pueda quitar un seat o cancelar todo.

**Non-Goals:**
- Eventos distintos en una compra, pago parcial o pago con varias tarjetas.
- Cambiar "My tickets".

## Decisions

### 1. Una sola página para una o N reservas
`CheckoutPage` obtiene los ids de `:reservationId` (uno) o de `?ids=` (de 1 a 8, separados por coma) con un hook `useCheckoutIds()` en `shared/lib` (lo usa también el aviso para ocultarse). Un valor inválido —id que no es UUID, repetido, más de 8, vacío— da "Reservation not found" sin llamar a la API. `ROUTES.checkoutFor(ids)` arma `/checkout/<id>` con uno y `/checkout?ids=a,b` con varios, y se registran las dos rutas con la misma página. Se conserva el comportamiento de una reserva, así que las pruebas actuales siguen valiendo.

### 2. Estado del grupo derivado de la API
`useReservations(ids)` (en `features/reservations`) consulta cada reserva con `useQueries` sobre `reservationKeys.detail` (la misma caché que el resto). Una función pura `groupCheckout(reservations)` devuelve: `payable` (las `ACTIVE`, en el orden del enlace), `ended` (las demás, con su estado), `total` (en centavos) y `soonest` (la que vence primero). Reglas de vistas: si alguna da `403/404` o son de eventos distintos → "Reservation not found"; si `payable` está vacío → la vista terminada del estado (todas `CONFIRMED` → pagada; si no, la primera no pagada: vencida o cancelada); si `payable` no está vacío y hay `ended` → aviso de "no vigentes" y el formulario solo para `payable`. La UI nunca deduce cuál venció a partir del error de la compra.

### 3. Pagar
`ticketsApi.purchase({ reservationIds, card })` devuelve `PurchaseResult { orderId, amount, tickets }`. `usePurchase` y `CardForm` pasan a ese tipo; el total del botón ("Pay $99.98") sale de `groupCheckout`. El cuerpo lleva solo las reservas vigentes, de modo que pagar "lo que sigue" no incluye las vencidas. Al `201`: se quitan del store todas las pagadas (`removeHold` por cada una), se invalidan seats y tickets y se muestra la confirmación. El `200` desaparece.

### 4. Resultados del pago (`purchase-errors`)
- `DUPLICATE_PAYMENT` → `SHOW_PAID` (mismo tratamiento de la vista "ya pagada"; los hold se descartan).
- `PAYMENT_IN_PROGRESS` → `KEEP_FORM` con su mensaje; la tarjeta se conserva y no se marca como pago fallido.
- `ORDER_AMOUNT_TOO_LARGE` → `KEEP_FORM` con su mensaje; `RESERVATIONS_MISMATCH` → `KEEP_FORM` con el mensaje genérico (es un defecto).
- `RESERVATION_EXPIRED` y `RESERVATION_ALREADY_CANCELLED` pasan a una acción nueva `REFRESH_GROUP`: se vuelven a consultar todas las reservas y la derivación de la decisión 2 decide la vista. Con una sola reserva se mantiene `SHOW_EXPIRED`/`SHOW_CANCELLED` (la vista terminada ya forzada), para no depender de que la consulta devuelva el estado nuevo al instante.
- El mensaje del `504` agrega "in a few seconds" porque un reintento inmediato recibe `PAYMENT_IN_PROGRESS`.

### 5. Bloqueo al vencer
La cuenta regresiva que se muestra es la de `soonest`. Al llegar a cero se guarda su id en `timeUpFor` y se consultan todas las reservas; mientras `soonest.id === timeUpFor` (la API sigue diciendo `ACTIVE`) "Pay" queda bloqueado, como hoy con una reserva. Cuando la API la marca `EXPIRED`, `soonest` pasa a la siguiente (otro id) y el pago se desbloquea para lo que queda, o aparece la vista de vencida si no queda nada. `Countdown` se monta con `key` del id para reiniciarse.

### 6. Quitar un seat y cancelar todo
`CancelReservation` pasa a recibir la lista de reservas vigentes. Con una: "Cancel reservation" como hoy. Con varias: "Cancel all" (cancela cada una con `Promise.allSettled`) y, por seat, un botón "Remove <label>" con su propio diálogo. Un seat quitado sale del enlace con `navigate(..., { replace: true })` para que recargar no lo resucite. Tras "Cancel all" se vuelve al evento con "Reservations cancelled". Si algunas cancelaciones fallan, se quitan las que sí se cancelaron, se avisa con el error y la página vuelve a consultar. Todos los botones se deshabilitan durante un pago. `removeHold` ya existe por reserva.

### 7. Enlaces de grupo
`SeatMap` (pase sin cupo) y `HoldBanner` enlazan con `ROUTES.checkoutFor(ids)`, donde `ids` son las reservas en curso del **mismo evento** que la que vence primero (una compra es de un solo evento). Tras reservar, `useReserveSelection` navega a `ROUTES.checkoutFor` de todas las reservas creadas. El aviso se oculta cuando el checkout abierto incluye la reserva a la que enlaza.

### 8. Confirmación
`TicketIssuedView` recibe `PurchaseResult`: con un ticket se ve como hoy ("Ticket issued", seat en `code-lg`); con varios, "Tickets issued", los seats en `code-md` con su monto, y el total. `EndedView` pide el conteo para decir "These reservations are already paid".

### 9. Mensajes y datos de prueba
`ERROR_CODES` y `ERROR_MESSAGES` ganan `DUPLICATE_PAYMENT`, `PAYMENT_IN_PROGRESS`, `RESERVATIONS_MISMATCH` y `ORDER_AMOUNT_TOO_LARGE`. El handler de MSW de `POST /tickets/purchase` imita el contrato: `reservationIds` (el campo antiguo → `400`), mismos controles y orden que la API, un solo pedido, `201` siempre y `DUPLICATE_PAYMENT` si alguna ya está pagada.

## Risks / Trade-offs

- [Un intento tras un `504`] → durante 30 s la API responde `PAYMENT_IN_PROGRESS`: el mensaje del `504` y el de `PAYMENT_IN_PROGRESS` piden esperar y la tarjeta se conserva; no se reintenta solo.
- [Reservas de eventos distintos en un enlace escrito a mano] → la UI las trata como "no encontradas" en vez de dejar que la API responda `RESERVATIONS_MISMATCH`.
- [Un grupo en el que vence una mientras el usuario escribe la tarjeta] → el pago se bloquea hasta que la API confirma y luego cobra solo lo vigente; el total del botón cambia, y eso se anuncia con el aviso de "no vigentes".
- [Cancelar todo con fallos parciales] → no es atómico (una cancelación por reserva): se muestra el resultado real y se vuelve a consultar.
- [Dos pestañas pagando lo mismo] → `PAYMENT_IN_PROGRESS` o `DUPLICATE_PAYMENT`, ambos manejados sin cobrar dos veces.
- [Gap conocido del backend: re-pago del mismo conjunto tras un reembolso pendiente → `500`] → llega como error genérico; no se trata aquí.
