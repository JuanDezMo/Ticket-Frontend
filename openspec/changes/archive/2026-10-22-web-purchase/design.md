## Context

- **Backend listo** (`ticket-api`, `docs/architecture.md` §11): `POST /reservations`, `GET /reservations/:id` (estado efectivo `EXPIRED`), `POST /reservations/:id/cancel`, `POST /tickets/purchase` (idempotente por reserva: `201` al emitir, `200` si ya existía) y `GET /tickets/me`. Los errores y sus acciones ya están en `docs/api-integration.md`.
- **Frontend listo:** el cliente HTTP con `ApiError`, la tabla de mensajes de error (ya incluye todos los códigos de pago), la selección de seat en Zustand, el pase y la regla de 10 tramos dibujados, y el sistema de `DESIGN.md` (Laminate, tres tamaños de letra, acento solo en lo que se pulsa, sin tarjetas anidadas).
- **Pasarela (reglas de prueba):** la tarjeta que termina en `0000` se rechaza (`402`), en `9999` da error simulado (`502`, y `422` al tercer intento con la misma tarjeta en la misma reserva) y cualquier otra se aprueba. Franquicias: `VISA`, `MASTERCARD`, `AMEX`.

## Goals / Non-Goals

**Goals:**
- Un flujo de compra que el usuario pueda recorrer en el teléfono sin perder la reserva si recarga o navega.
- Que la UI nunca provoque un doble cobro ni guarde datos de tarjeta.

**Non-Goals:**
- Reembolsos, varios seats por compra, tickets con QR.

## Decisions

### 1. Dos features nuevas y la dirección de dependencias
- `features/reservations`: API, estado de la reserva en curso, cuenta regresiva y aviso. No importa a otras features.
- `features/tickets`: checkout, formulario de tarjeta, compra y "Mis tickets". Importa de `reservations`, `events` y `seats` solo por sus `index.ts`.
- `features/seats` importa de `reservations` (reservar desde el pase). El orden queda `tickets → events → seats → reservations`, sin ciclos (lo comprueba dependency-cruiser).
- `seats` exporta además `seatKeys`, para que quien reserva o cancela pueda actualizar el mapa sin duplicar claves de consulta.

### 2. Estado de la reserva en curso (Zustand, `sessionStorage`)
`useHoldStore` guarda `{ reservationId, eventId, seatLabel, amount, createdAt, expiresAt }` con `persist` en `sessionStorage` (clave `ticket-hold`): sobrevive a una recarga pero no pasa a otra pestaña ni dura más que la sesión del navegador. No contiene datos de tarjeta ni del usuario.
- **Fuente de verdad:** la API. El store solo sabe qué consultar. `useHold()` combina el store con `useReservation(id)` y descarta la reserva (`clear()`) cuando la API responde un estado distinto de `ACTIVE`.
- Se limpia también al terminar la sesión (junto con la caché, en `providers.tsx`).
- *Alternativa:* guardar solo en TanStack Query. Se descarta: no sobrevive a una recarga, y el usuario pidió Zustand para el estado del cliente.

### 3. Consulta de la reserva
`useReservation(id)`: consulta `GET /reservations/:id`, con `refetchInterval` de 30 s mientras esté `ACTIVE` (detecta una cancelación o un pago hecho en otra pestaña) y sin reintentos ante 4xx. Al llegar a cero la cuenta regresiva se llama a `refetch()`.

### 4. Cuenta regresiva
- `useCountdown(expiresAt)` calcula `remainingMs = expiresAt − Date.now()` en un `setInterval` de 1 s (no acumula el paso del tiempo: vuelve a leer el reloj, así no se desfasa si la pestaña estuvo en segundo plano) y avisa al llegar a cero.
- `HoldRuler` dibuja 10 tramos; los encendidos son `ceil(remaining / (total / 10))`, con `total = expiresAt − createdAt`. Así la regla es exacta aunque el TTL del servidor no sea 10 minutos.
- **Accesibilidad:** el texto "mm:ss" es `aria-hidden`; un `role="status"` aparte anuncia en 5 minutos, en 1 minuto y al vencer, nunca cada segundo.
- **Desfase de reloj:** si el reloj del dispositivo adelanta o atrasa, la cuenta puede equivocarse unos segundos. Por eso, al llegar a cero y antes de pagar, la API decide: `409 RESERVATION_EXPIRED` siempre gana.

### 5. Reservar desde el pase
`useReserveSeat()` (en `reservations`) es una mutación sin reintentos. `SeatMap` la usa y hace sus efectos: en `onSuccess` guarda la reserva en el store, limpia la selección, actualiza `seatKeys.byEvent(eventId)` y navega a `/checkout/:id`; en `onError` muestra el mensaje de la tabla de errores y, ante `SEAT_NOT_AVAILABLE`, actualiza el mapa y quita la selección. `SelectionPass` recibe `onReserve`, `reserving` y `holdingLabel` por props.

### 6. Una sola reserva a la vez
Es una regla del cliente: con una reserva activa en el store, `SelectionPass` deshabilita "Reserve" y muestra "You are holding C7…" con el enlace al checkout. El backend permitiría varias; se limita en la UI para que el aviso, el store y el checkout sigan siendo simples.

### 7. Checkout como una máquina de estados por pantalla
`CheckoutPage` lee `useReservation(id)` y elige una vista con una tabla `Record<ReservationStatus, View>`: `ACTIVE` → `PayView`; `EXPIRED`, `CANCELLED`, `CANCELLED_BY_USER`, `CONFIRMED` → `EndedView` con su mensaje y acción; `404` y `403` → `NotFoundView`. Un id que no es UUID no llama a la API (mismo criterio que el detalle del evento).
- El pago exitoso guarda el ticket en el estado local de la página y muestra `TicketIssuedView`. Si se recarga, la reserva ya figura `CONFIRMED` y se ve "already paid".

### 8. Formulario de tarjeta y datos sensibles
- `card.schemas.ts` (zod): franquicia (`VISA`, `MASTERCARD`, `AMEX`), número de 13 a 19 dígitos (quita espacios), vencimiento `MM/YY` no vencido, CVV de 3 dígitos. Los mismos límites que la pasarela; así un error de formato no consume intentos.
- `react-hook-form` con `autoComplete` (`cc-type`, `cc-number`, `cc-exp`, `cc-csc`) y `inputMode="numeric"`. Los valores viven solo en el formulario.
- **Reglas de no persistencia:** nada de la tarjeta va a `localStorage`, `sessionStorage`, la caché de TanStack Query (la mutación no guarda `variables`: `gcTime: 0` y no se registran en la caché), la URL ni consola. Al desmontar, `reset()`.
- Tras `402` y `422` se vacían número y CVV con `resetField` y el foco va al número; en `502`, `504` y errores de red se conservan.

### 9. Respuesta a cada pago por tabla
`PURCHASE_ERROR_ACTIONS: Record<ErrorCode, PurchaseAction>` en `tickets/purchase-errors.ts`, con acciones `CLEAR_CARD`, `KEEP_FORM`, `FIELD_ERROR`, `SHOW_EXPIRED`, `SHOW_CANCELLED`, `SHOW_EVENT_CANCELLED` y `SHOW_NOT_FOUND`. Un código nuevo es una entrada más; los mensajes salen de `ERROR_MESSAGES` (algunos textos específicos de `504` se agregan ahí). Un código sin entrada usa `KEEP_FORM` con el mensaje genérico.

### 10. Pago en curso y cancelación
Un solo estado `isPaying` (de la mutación de compra) deshabilita los campos, "Pay" y "Cancel reservation". La cancelación pide confirmación con un `alert-dialog` de shadcn (Radix: foco atrapado, Escape y retorno de foco). Mientras la cancelación se envía, "Pay" también se deshabilita.
- **Cancelar durante un pago** queda bloqueado en la UI: el backend registraría el cobro como `REFUND_PENDING` (`docs/api-integration.md`).

### 11. Aviso de reserva en curso
`HoldBanner` (exportado por `reservations`) se monta en `AppLayout` debajo del encabezado, solo para USER con una reserva activa y fuera de `/checkout/:id`. Muestra el seat, el tiempo restante y el enlace. Usa `Laminate` (sin anidar) y no reemplaza ninguna navegación.

### 12. Mis tickets
`tickets/api.ts` (`listMine({ page, pageSize })`), `useMyTickets(page)` con `keepPreviousData`, y `MyTicketsPage` con la página en la URL. `Pagination` (hoy en `events/components`) se mueve a `shared/ui/pagination.tsx` para que la usen las dos features. Cada ticket es un `Laminate` con el seat en letra de bloque (el mismo lenguaje del pase) y un enlace al evento.

### 13. Servidor simulado y pruebas
- **MSW:** handlers para reservar (con control de seats tomados y de reservas por usuario), consultar y cancelar (con el estado efectivo `EXPIRED` según una hora controlable), comprar (el final de la tarjeta decide: `0000` → `402`, `9999` → `502`; un `Date` por prueba para el tiempo agotado) y listar tickets.
- **Tiempo:** la cuenta regresiva se prueba con `vi.useFakeTimers()` y `vi.setSystemTime()`.
- **Seguridad:** una prueba comprueba que, tras pagar y fallar, no hay datos de tarjeta en `localStorage`, `sessionStorage` ni en la caché de consultas.

## Risks / Trade-offs

- [Doble cobro por un reintento] → la UI nunca reintenta sola, el botón se bloquea mientras paga, y el backend es idempotente por reserva.
- [Datos de tarjeta filtrados al navegador] → ninguna capa los guarda (decisión 8) y hay una prueba que lo verifica.
- [Reloj del dispositivo desfasado] → la API decide; la UI vuelve a consultar al llegar a cero y el pago responde `409 RESERVATION_EXPIRED`.
- [Cerrar la pestaña en medio del pago] → la reserva puede quedar `CONFIRMED`; al volver, el aviso se descarta y "My tickets" muestra el ticket.
- [Reserva retenida y olvidada] → vence sola por TTL; el aviso en toda la app y "Cancel reservation" la liberan antes.
- [Límite de la pasarela: 3 errores con la misma tarjeta] → el `422` al tercero ya pide otro medio de pago; el texto de `502` no promete reintentos ilimitados.
- [Alcance grande] → se parte en grupos con pruebas por grupo; si hace falta, "Mis tickets" puede salir como un cambio aparte sin afectar al checkout.
