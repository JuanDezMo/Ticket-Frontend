## Why

Hoy la UI solo permite elegir un seat y tener **una** reserva activa (regla de la interfaz, decisión 6 de `web-purchase`). Con un límite por evento mayor que 1, el comprador debe poder elegir varios seats, reservarlos y ver cuánto tiempo le queda de cada uno.

## What Changes

- **Selección múltiple:** el mapa permite elegir hasta N seats (N = `maxSeatsPerUser` del evento, menos lo que el usuario ya tiene reservado). Pulsar uno elegido lo quita. El pase muestra los seats elegidos, el total y "Reserve N seats".
- **Reservar varios:** una solicitud de reserva por seat; si alguno falla (`SEAT_NOT_AVAILABLE`, `SEAT_LIMIT_REACHED`), la UI conserva los que sí se reservaron, avisa cuáles fallaron y quita esos de la selección.
- **Varias reservas en curso:** el store de la reserva en curso (`ticket-hold`, `sessionStorage`) guarda una **lista** de reservas, no una. Cada una se valida con la API y se descarta si no está `ACTIVE`.
- **Aviso de reserva:** "3 seats held" con el tiempo del que vence primero y "Continue to checkout".
- **Límite visible:** el pase indica "You can hold up to N seats" y cuántos quedan; con el límite alcanzado, "Reserve" se deshabilita y explica por qué.
- Se reemplaza la regla "una sola reserva a la vez" por la del límite del evento.

## Fuera de alcance

- Pagar el grupo en una sola compra (`web-group-checkout`): mientras no exista, el checkout paga una reserva a la vez.
- Reservar seats de distintos eventos con un mismo pase.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `seat-reservation`: varias reservas en curso, y el límite por evento sustituye a "una sola reserva a la vez".
- `seat-map-presentation`: selección de varios seats y el pase con la lista y el total.

## Impact

- **Código:** `features/seats` (store de selección, `SeatMap`, `SelectionPass`, `useReserveSelection`), `features/reservations` (store, `useHold`, `HoldBanner`, claves), `AppLayout` y las pruebas de ambos.
- **Cambio de modelo:** el store pasa de una reserva a una lista (`Hold` → `Hold[]`) y se migra el valor guardado en `sessionStorage`.
- **Esfuerzo estimado:** 3 a 5 días con pruebas; es el cambio de UI con más riesgo.
- **Depende de:** `web-event-seat-limit` y `seat-limit-enforcement` en `ticket-api`.
