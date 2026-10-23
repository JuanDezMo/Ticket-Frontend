## Context

- **Backend ya cambiado:** `POST /reservations` recibe `{ eventId, seats: [...] }` (1 a 8, sin repetidos) y responde `201 { reservations: [...] }` en el orden pedido. Es **todo o nada** y todas comparten `expiresAt`. Errores nuevos: `409 SEAT_LIMIT_REACHED` (límite del evento: ACTIVE vigentes + CONFIRMED + pedidas) y `409 HOLD_LIMIT_REACHED` (tope global por cuenta, valor no expuesto). El campo `seat` responde `400`.
- **Frontend actual:** `useSeatSelectionStore` guarda un solo `seatLabel`; `useHoldStore` guarda un solo `hold` (persistido en `sessionStorage`, clave `ticket-hold`); `useHold`, `HoldBanner`, `SelectionPass` y `SeatMap` asumen una reserva. `CheckoutPage` y `CancelReservation` llaman a `clearHold()` al terminar.
- Reglas de capas: `seats` importa de `reservations` por su `index.ts`; `reservations` no importa de `seats`; `tickets` importa de ambos por su `index.ts`.

## Goals / Non-Goals

**Goals:**
- Elegir y reservar varios seats en una sola solicitud, con el límite del evento visible.
- Tener varias reservas en curso sin romper la recarga ni el valor guardado antes.

**Non-Goals:**
- Pagar el grupo (`web-group-checkout`). El checkout sigue pagando una reserva y usa el contrato antiguo de compra: **pagar no funciona contra el backend nuevo hasta ese change**. Se deja dicho en la propuesta y no se parchea aquí.
- Saber lo ya comprado en el evento: la API lo hace valer.

## Decisions

### 1. Reservar en lote (corrige la propuesta inicial)
La propuesta decía "una solicitud por seat", pero el backend reserva el lote completo o nada. `reservationsApi.create(eventId, seats)` envía la lista y devuelve `Reservation[]` (se extrae `reservations` de la respuesta). Ante un error no se guarda nada. Con `SEAT_NOT_AVAILABLE` solo se actualiza el mapa: la propia lógica de selección quita los seats que ya no están disponibles (decisión 3), sin leer el texto del error.

### 2. Cupo = límite − reservas en curso del evento
Una función pura `seatAllowance(maxSeatsPerUser, holds, eventId)` en `features/seats` devuelve cuántos seats más puede elegir el USER: `max(0, maxSeatsPerUser − reservas en curso de ese evento)`. Las de otros eventos no cuentan. Es una **ayuda**: no conoce lo comprado (habría que consultar `GET /tickets/me`), así que `SEAT_LIMIT_REACHED` se maneja siempre, con el mensaje armado desde `event.maxSeatsPerUser` ("You can hold up to N seats for this event"), nunca parseando el texto de la API. `HOLD_LIMIT_REACHED` usa un mensaje genérico en la tabla de errores porque la UI no conoce el tope.

### 3. Store de selección con lista
`useSeatSelectionStore` guarda `eventId`, `seatLabels: string[]` y `lostSeatLabels: string[]`. Sigue en memoria (una selección sin reservar no retiene el seat). `toggle(eventId, label, allowance)` aplica la regla del cupo y devuelve si lo aceptó: quita si ya estaba; con cupo 1 reemplaza (comportamiento de siempre); con cupo mayor y lleno, no agrega. Cambiar de evento reemplaza la selección. `useSelectedSeats` reemplaza a `useSelectedSeat`: quita de la lista los seats que ya no están `AVAILABLE` y los deja en `lostSeatLabels` para avisar con un texto único ("A3, A4 and A5 were just taken. Pick other seats").

### 4. Store de reservas en curso con lista y migración
`useHoldStore` pasa a `holds: Hold[]` con `add(reservations)`, `remove(id)` y `clear()`; `Hold` no cambia. `persist` sube a `version: 2` con `migrate`: un valor de la versión anterior (`{ hold }`) se convierte en `{ holds: hold ? [hold] : [] }`, así una reserva activa sobrevive al despliegue y la lectura nunca falla. `useHolds` reemplaza a `useHold`: consulta cada reserva (`useQueries` sobre `reservationKeys.detail`), devuelve las vigentes ordenadas por `expiresAt` y descarta del store las que no están `ACTIVE` o dan `403/404`, una por una.

### 5. Aviso, pase y checkout
- **Aviso:** "Seat C7 is held" con una; "3 seats held" con varias. La cuenta regresiva es la de la que vence primero y el enlace va a su checkout; se oculta en ese checkout.
- **Pase:** muestra los códigos (en móvil los 3 primeros y "+N"; la lista completa va en "Details"), el total y "Reserve" / "Reserve N seats". El total se calcula en centavos (`Math.round(price * 100) * n / 100`) para no arrastrar errores de coma flotante. Con `maxSeatsPerUser` mayor que 1 agrega "k of N seats selected". Sin cupo, "Reserve" se deshabilita y el aviso "You are holding N seats, the most for this event" reemplaza al de "You are holding <seat>".
- **Cupo lleno:** pulsar otro seat no lo selecciona y un `role="status"` dice "You can select up to N seats" (no es un fallo silencioso).
- **Checkout y cancelación:** `clearHold()` pasa a `removeHold(id)` para no borrar las demás reservas. Tras reservar, la UI lleva al checkout de la primera reserva.

### 6. Errores y datos de prueba
`HOLD_LIMIT_REACHED` se agrega a `ERROR_CODES` y a la tabla. El handler de MSW de `POST /reservations` imita la API: lote todo o nada, `seat` antiguo → `400`, `SEAT_NOT_AVAILABLE`, `SEAT_LIMIT_REACHED` (cuenta sus reservas activas en el evento) y `HOLD_LIMIT_REACHED` (cuenta de 8). `makeReservation` y los helpers de prueba usan la lista.

## Risks / Trade-offs

- [Respuesta perdida] → si la red falla después de que el servidor reservó, la UI no ve esas reservas (no hay un endpoint que liste las activas). El usuario vería sus seats como ocupados y recibiría `SEAT_NOT_AVAILABLE` al reintentar. Se acepta y se documenta; el vencimiento (10 min) las libera. No se reintenta automáticamente.
- [Cupo mal calculado] → la UI no conoce lo comprado: el servidor manda y la UI lo explica con el límite del evento.
- [Pagar roto hasta `web-group-checkout`] → el checkout usa el contrato antiguo. Mitigación: hacer ese change enseguida y no desplegar entre ambos.
- [Pase de móvil con muchos seats] → se limita a 3 códigos y "+N" para respetar los 120 px.
- [Reservas de lotes distintos con vencimientos distintos] → el aviso cuenta la más próxima; el detalle de cada una se ve en su checkout.
