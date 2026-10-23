## Why

El backend va a permitir un máximo de seats por usuario **definido por evento** (`maxSeatsPerUser`, change `event-seat-limit` en `ticket-api`). El ADMIN debe fijarlo al crear el evento, y el comprador debe saber cuántos seats puede llevar antes de elegir.

## What Changes

- **Crear evento:** campo obligatorio "Max seats per buyer" (entero de 1 a 8, y no mayor que la capacidad), con una nota que dice que no se puede cambiar después. Sin valor por defecto, para que sea una decisión.
- **Panel de admin:** cada evento muestra su límite junto a la capacidad.
- **Detalle del evento:** el encabezado indica "Up to N seats per buyer" cuando N es mayor que 1.
- El tipo `Event` y los mocks de MSW incluyen el campo.
- Mensaje para el error `SEAT_LIMIT_REACHED` en la tabla de errores: "You can hold up to N seats for this event" (se prepara aquí aunque se use en `web-multi-seat-hold`).

## Fuera de alcance

- Elegir varios seats o reservarlos (`web-multi-seat-hold`).
- Editar el límite de un evento existente.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `admin-events`: el formulario de crear evento pide el límite, y el panel lo muestra.
- `event-detail`: el encabezado informa el límite por comprador.

## Impact

- **Código:** `features/events/types.ts`, `features/admin` (esquema, formulario, fila del panel), `EventDetails.tsx`, `shared/api` (código de error), `src/test/msw` y fixtures.
- **API:** envía `maxSeatsPerUser` en `POST /events` y lo lee de las respuestas.
- **Esfuerzo estimado:** 0,5 a 1 día con pruebas.
- **Depende de:** `event-seat-limit` en `ticket-api` (con un backend sin el campo, la creación de eventos falla, así que se despliegan juntos).
