## Why

Hoy la UI solo permite elegir un seat y tener **una** reserva activa (regla de la interfaz, decisión 6 de `web-purchase`), y reserva con el contrato antiguo de `POST /reservations` (`seat`), que `ticket-api` ya rechaza con `400`. Con un límite por evento mayor que 1, el comprador debe poder elegir varios seats, reservarlos de una vez y ver cuánto tiempo le queda.

## What Changes

- **Selección múltiple:** el mapa permite elegir hasta N seats (N = `maxSeatsPerUser` del evento menos las reservas en curso que el usuario ya tiene en ese evento). Pulsar uno elegido lo quita. Con un máximo de 1 todo se comporta como hoy (pulsar otro reemplaza). El pase muestra los seats elegidos, el total y "Reserve N seats".
- **Reservar en lote:** una sola solicitud `POST /reservations` con `{ eventId, seats: [...] }`. La API es **todo o nada**: si algún seat falla no se reserva ninguno; la UI no da por reservado nada, actualiza el mapa y quita de la selección solo los seats que ya no están disponibles. (Reemplaza la idea inicial de "una solicitud por seat".)
- **Varias reservas en curso:** el store de la reserva en curso (`ticket-hold`, `sessionStorage`) guarda una **lista**. Cada una se valida con la API y se descarta si no está `ACTIVE`. El valor guardado con la forma anterior se convierte en una lista de una.
- **Aviso de reserva:** "3 seats held" con el tiempo del vencimiento más próximo y "Continue to checkout".
- **Límite visible y errores del servidor:** el pase indica cuántos seats se eligieron de cuántos se pueden elegir; sin cupo, "Reserve" se deshabilita y explica por qué. La cuenta de la UI es una ayuda (no conoce lo ya comprado): `SEAT_LIMIT_REACHED` y `HOLD_LIMIT_REACHED` se manejan siempre.
- Se reemplaza la regla "una sola reserva a la vez" por la del límite del evento. Cancelar una reserva quita solo esa de la lista.

## Fuera de alcance

- Pagar el grupo en una sola compra (`web-group-checkout`). Mientras no exista, tras reservar la UI lleva al checkout de la primera reserva y el resto sigue en el aviso. **El checkout seguirá usando el contrato antiguo de `POST /tickets/purchase`, que `ticket-api` ya rechaza: pagar no funciona contra el backend nuevo hasta `web-group-checkout`.**
- Reservar seats de distintos eventos con un mismo pase.
- Conocer lo ya comprado en el evento (requeriría `GET /tickets/me`): la API lo hace valer con `SEAT_LIMIT_REACHED`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `seat-reservation`: reservar en lote, varias reservas en curso, el límite por evento sustituye a "una sola reserva a la vez".
- `seat-map-presentation`: el pase con la lista de seats, el total y la cuenta; recuperación cuando se pierden varios seats; texto previo a elegir.
- `event-detail`: selección de varios seats.

## Impact

- **Código:** `features/seats` (store de selección, `SeatMap`, `SelectionPass`, `useReserveSelection`), `features/reservations` (api, store, `useHolds`, `HoldBanner`), `features/tickets` (quitar solo la reserva pagada o cancelada), `shared/api` (`HOLD_LIMIT_REACHED`), MSW y las pruebas de ambos.
- **Cambio de modelo:** el store pasa de una reserva a una lista (`Hold` → `Hold[]`) y se migra el valor guardado en `sessionStorage`.
- **Esfuerzo estimado:** 3 a 5 días con pruebas; es el cambio de UI con más riesgo.
- **Depende de:** `web-event-seat-limit` (archivado) y `seat-limit-enforcement` en `ticket-api`.
