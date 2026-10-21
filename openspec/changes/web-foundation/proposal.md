## Why

`ticket-api` ya expone autenticación, eventos, reservas y compra, pero no hay una interfaz para usarla. Esta primera iteración monta la base sobre la que se construyen las pantallas de las iteraciones siguientes (eventos, compra, admin): proyecto, layout, comunicación con la API, manejo de errores y sesión por rol.

## What Changes

- Proyecto nuevo con Vite, React, TypeScript estricto y pnpm, con Tailwind CSS y shadcn/ui.
- Estructura por features y reglas de capas verificadas automáticamente (ver `docs/architecture.md`).
- Proxy `/api` hacia `ticket-api` en desarrollo, porque la API no tiene CORS (hueco 1 de `docs/api-integration.md`).
- Cliente HTTP propio que envía el token y convierte las respuestas `{ code, message }` en errores tipados con un mensaje en inglés para la UI.
- Pantallas de registro (`POST /auth/register`) y login (`POST /auth/login`).
- Sesión del lado del cliente: token, `userId` y rol tomados del JWT (hueco 4); se conserva al recargar y se cierra al vencer el token o al recibir `401`.
- Layout con navegación según el rol (visitante, USER, ADMIN) y rutas protegidas por rol.
- Base de pruebas: pruebas de componentes con la red simulada y scripts de lint, formato, tipos y arquitectura.

## Fuera de alcance

- Listado de eventos y mapa de seats (iteración 2, `web-events`); en esta iteración la página de inicio es un placeholder.
- Reserva, checkout y mis tickets (iteración 3, `web-purchase`).
- Crear eventos, cancelar eventos y crear usuarios (iteración 4, `web-admin`).
- E2E, Docker con nginx y auditoría de accesibilidad (iteración 5, `web-hardening`).
- Cambios en `ticket-api`: los huecos del backend se documentan en `docs/api-integration.md` y se deciden aparte.
- Refresh token, recuperar contraseña, perfil de usuario e internacionalización.

## Capabilities

### New Capabilities

- `api-client`: comunicación con `ticket-api`, envío del token y traducción de los errores `{ code, message }` a mensajes y acciones de la UI.
- `session-auth`: registro, login, sesión persistente basada en el JWT, logout y expiración.
- `app-shell`: layout, navegación según el rol, rutas protegidas y páginas de "sin permiso" y "no encontrado".

### Modified Capabilities

Ninguna (proyecto nuevo).

## Impact

- Repositorio nuevo `ticket_frontend`; no se modifica `ticket-api`.
- Dependencias nuevas: las de la iteración 1 en `docs/api-integration.md` (sección 4).
- Requiere `ticket-api` corriendo en `http://localhost:3000` (configurable) para el uso manual; las pruebas no lo necesitan.
