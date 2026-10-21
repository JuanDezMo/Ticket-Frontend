# ticket-frontend – Integración con ticket-api

Fuente del contrato: `docs/architecture.md` (sección 11) y `docs/business-rules.md` de `ticket-api`.

## 1. Endpoints por pantalla

| Pantalla                                                                                         | Endpoint                                           | Rol          |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------ |
| Registro / Login                                                                                 | `POST /auth/register`, `POST /auth/login`          | público      |
| Listado de eventos (`page`, `pageSize` 1–20, `status`, `type`, `startFrom`, `startTo`, `search`) | `GET /events`                                      | público      |
| Detalle de evento (`/events/:id`)                                                                | `GET /events/:id`                                  | público      |
| Mapa de seats                                                                                    | `GET /events/:id/seats?status=`                    | autenticado  |
| Reservar seat                                                                                    | `POST /reservations` `{ eventId, seat }`           | USER         |
| Reserva en curso (recarga, cuenta regresiva)                                                     | `GET /reservations/:id`                            | USER (dueño) |
| Cancelar mi reserva                                                                              | `POST /reservations/:id/cancel`                    | USER (dueño) |
| Checkout                                                                                         | `POST /tickets/purchase` `{ reservationId, card }` | USER         |
| Mis tickets                                                                                      | `GET /tickets/me`                                  | USER         |
| Crear evento                                                                                     | `POST /events`                                     | ADMIN        |
| Cancelar evento                                                                                  | `POST /events/:id/cancel`                          | ADMIN        |
| Crear usuario                                                                                    | `POST /users` `{ email, password, role }`          | ADMIN        |

Implementado en `web-events`: listado (`/`, 12 por página, filtros en la URL), detalle (`/events/:id`) y mapa de seats con selección de un seat (store de Zustand `features/seats/store.ts`). Los montos (`price`, `amount`) se muestran en USD.

## 2. Errores: del `code` a la acción en la UI

Todas las respuestas de error tienen la forma `{ code, message }`. La UI decide por `code` usando una tabla (`shared/api/error-messages.ts`).

| `code`                                                       | HTTP | Acción en la UI                                                                                 |
| ------------------------------------------------------------ | ---- | ----------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`                                           | 400  | Mostrar el mensaje junto al formulario                                                          |
| `CARD_BRAND_REQUIRED`, `CARD_BRAND_NOT_ALLOWED`              | 400  | Error en el campo de franquicia                                                                 |
| `UNAUTHORIZED`                                               | 401  | Cerrar sesión y llevar a login                                                                  |
| `INVALID_CREDENTIALS`                                        | 401  | Error en el formulario de login                                                                 |
| `FORBIDDEN`                                                  | 403  | Mensaje de sin permiso                                                                          |
| `EVENT_NOT_FOUND`, `SEAT_NOT_FOUND`, `RESERVATION_NOT_FOUND` | 404  | Mensaje y volver al listado                                                                     |
| `EMAIL_ALREADY_EXISTS`                                       | 409  | Error en el campo email                                                                         |
| `SEAT_NOT_AVAILABLE`                                         | 409  | Refrescar el mapa de seats y pedir otro                                                         |
| `EVENT_NOT_ACTIVE`, `EVENT_CANCELLED`                        | 409  | Bloquear la reserva y la compra del evento                                                      |
| `RESERVATION_EXPIRED`                                        | 409  | Limpiar la reserva en curso y volver al mapa                                                    |
| `RESERVATION_ALREADY_CANCELLED`                              | 409  | Limpiar la reserva en curso y volver al mapa (ya estaba cancelada, por ejemplo en otra pestaña) |
| `RESERVATION_ALREADY_CONFIRMED`                              | 409  | La reserva ya está pagada: llevar a mis tickets                                                 |
| `EVENT_ALREADY_CANCELLED`, `EVENT_ALREADY_ENDED`             | 409  | Mensaje en el panel de admin                                                                    |
| `PAYMENT_REJECTED`                                           | 402  | Pedir otra tarjeta                                                                              |
| `CARD_PROBLEM`                                               | 422  | Pedir otro medio de pago                                                                        |
| `PAYMENT_GATEWAY_ERROR`                                      | 502  | Botón de reintentar (manual, nunca automático)                                                  |
| `PAYMENT_GATEWAY_TIMEOUT`                                    | 504  | Botón de reintentar (manual, nunca automático)                                                  |
| `INTERNAL_ERROR`                                             | 500  | Mensaje genérico                                                                                |

Compra: `201` es un ticket nuevo y `200` el mismo ticket de un reintento. Ambos se muestran como éxito.

## 3. Huecos del backend

Decisión tomada el 2026-10-21 para cada hueco:

| #   | Hueco                                     | Decisión                                                                                                                                            | Dónde                                                                                    |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Sin CORS                                  | UI: proxy de Vite en desarrollo y nginx en Docker. Sin cambios en la API                                                                            | Hecho en `web-foundation`                                                                |
| 2   | Sin `GET /events/:id`                     | Backend: endpoint público `GET /events/:id`                                                                                                         | Cambio `event-detail` en `ticket-api`, antes de `web-events`                             |
| 3   | Sin forma de recuperar la reserva activa  | Backend + UI: `GET /reservations/:id` (solo el dueño, con estado efectivo `EXPIRED`) y reserva en curso en Zustand con `persist` (`sessionStorage`) | Cambio `reservation-detail` en `ticket-api`, antes de `web-purchase`                     |
| 4   | El login no devuelve el usuario ni el rol | UI: decodificar el JWT (`sub`, `role`, `exp`); el email se toma del formulario. Sin `GET /auth/me`                                                  | Hecho en `web-foundation`                                                                |
| 5   | El usuario no puede cancelar su reserva   | Backend + UI: `POST /reservations/:id/cancel` (solo el dueño). La reserva pasa a `CANCELLED_BY_USER` y el seat vuelve a `AVAILABLE` al instante     | Cambio `reservation-cancel` en `ticket-api` (en implementación), antes de `web-purchase` |

### Notas para `web-purchase` (de `reservation-detail` y `reservation-cancel`)

- **Estados de la reserva:** `ACTIVE`, `EXPIRED`, `CONFIRMED`, `CANCELLED` (se canceló el evento) y `CANCELLED_BY_USER` (la canceló el dueño). El tipo de la UI debe aceptar los 5; solo `ACTIVE` permite pagar o cancelar.
- **Estado efectivo:** `GET /reservations/:id` devuelve `EXPIRED` si la reserva venció aunque el job del backend no la haya liberado. La cuenta regresiva usa `expiresAt`, pero la fuente de verdad es la respuesta del backend.
- **Respuesta de la cancelación:** `200` con el mismo cuerpo que `POST /reservations` y `status` `CANCELLED_BY_USER`. La UI limpia la reserva en curso (store con `persist`) e invalida la consulta de seats del evento, porque el seat ya está `AVAILABLE`.
- **Errores de la cancelación:** `409` con `RESERVATION_ALREADY_CANCELLED`, `RESERVATION_ALREADY_CONFIRMED`, `RESERVATION_EXPIRED` o `EVENT_CANCELLED`; `403` si la reserva no es del usuario.
- **Cancelar durante el pago:** si el usuario cancela mientras la compra está en curso y la pasarela aprueba, se cobra, no se emite ticket, el pago queda `REFUND_PENDING` y la compra responde `409 RESERVATION_ALREADY_CANCELLED`. **La UI debe deshabilitar "Cancelar reserva" mientras haya un pago en curso** y pedir confirmación antes de cancelar.
- **Compra de una reserva cancelada por el usuario:** responde `409 RESERVATION_ALREADY_CANCELLED` sin llamar a la pasarela.

## 4. Iteraciones y librerías

| Iteración (cambio OpenSpec) | Alcance                                                                                                                                  | Librerías nuevas                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. `web-foundation`         | Scaffolding, layout, http-client y errores tipados, login y registro, sesión, rutas protegidas por rol, reglas de capas                  | vite, react, typescript, react-router, @tanstack/react-query, zustand, zod, react-hook-form, @hookform/resolvers, jwt-decode, tailwindcss, shadcn/ui, lucide-react, sonner, eslint, typescript-eslint, eslint-plugin-react-hooks, prettier, dependency-cruiser, vitest, @testing-library/react, @testing-library/user-event, jsdom, msw |
| 2. `web-events`             | Listado paginado con filtros en la URL y mapa de seats por estado                                                                        | date-fns                                                                                                                                                                                                                                                                                                                                |
| 3. `web-purchase`           | Reservar, cuenta regresiva hasta `expiresAt`, recuperar y cancelar la reserva en curso, checkout con reacción a cada `code`, mis tickets | ninguna                                                                                                                                                                                                                                                                                                                                 |
| 4. `web-admin`              | Crear evento con vista previa de seats, cancelar evento con confirmación, crear usuarios                                                 | react-day-picker (fecha de shadcn)                                                                                                                                                                                                                                                                                                      |
| 5. `web-hardening`          | E2E contra docker-compose, Dockerfile con nginx, accesibilidad                                                                           | @playwright/test, @axe-core/playwright                                                                                                                                                                                                                                                                                                  |
