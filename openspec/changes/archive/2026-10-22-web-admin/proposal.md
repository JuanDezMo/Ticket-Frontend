## Why

Hoy `/admin` es un placeholder ("coming soon"): para crear un evento, cancelarlo o dar de alta a un usuario hay que usar curl contra `ticket-api`. Con el flujo del comprador cerrado (`web-purchase`), el administrador es la única pieza que falta del producto: sin él nadie puede publicar eventos ni retirar uno que se cancela con reservas y tickets vendidos.

## What Changes

- **Panel de eventos en `/admin`:** lista paginada de todos los eventos (activos y cancelados) con su estado, fecha, precio y capacidad, y accesos a "Create event" y "Create user".
- **Crear evento** en `/admin/events/new`: formulario con nombre, descripción, tipo, lugar, precio, capacidad, inicio y fin (calendario con hora), con las mismas reglas que `ticket-api`. Una **vista previa de seats** se dibuja mientras se escribe la capacidad (filas A a Z de 10) para que el administrador vea qué se va a generar. Al crear, lleva al detalle del evento.
- **Cancelar evento** desde el panel, con confirmación que dice qué pasa (se cancelan las reservas y los tickets). Al terminar informa cuántas reservas y tickets se cancelaron. Solo se ofrece para eventos activos que no han terminado.
- **Crear usuario** en `/admin/users/new`: email, contraseña y rol (`USER` o `ADMIN`); el error de email repetido aparece junto al campo.
- Cada pantalla de admin usa los mismos componentes, textos de error por código y lenguaje visual (Laminate, 44 px de objetivo táctil, dos temas) del resto de la aplicación.

## Fuera de alcance

- Editar un evento, cambiar su capacidad o eliminarlo (la API no lo permite: RN-EVT-2 y RN-EVT-3).
- Listar, editar o borrar usuarios (la API solo tiene `POST /users`).
- Reembolsos de los tickets de un evento cancelado (`REFUND_PENDING` es solo una marca del backend).
- Botón de cancelar dentro del detalle público del evento; el panel es el único lugar de administración.
- Estadísticas, reportes o exportaciones.
- Pruebas E2E con Playwright, Dockerfile con nginx y auditoría de accesibilidad con axe (`web-hardening`).
- Cambios en `ticket-api`.

## Capabilities

### New Capabilities

- `admin-events`: panel de eventos, creación con vista previa de seats y cancelación con confirmación.
- `admin-users`: creación de usuarios por un administrador.

### Modified Capabilities

Ninguna. La ruta `/admin` ya exige rol ADMIN (`app-shell`); solo cambia el contenido que muestra.

## Impact

- **Código nuevo:** `src/features/admin/` (páginas, formularios, esquemas, hooks y API de eventos y usuarios de administración).
- **Código existente:** `src/app/routes.tsx` (tres rutas de admin) y `src/app/pages.tsx` (se quita el placeholder), `features/events/index.ts` (exporta lo que admin necesita), `features/seats/index.ts` (exporta la vista previa de seats) y `features/auth/index.ts` (exporta los límites de contraseña).
- **Dependencia nueva de UI:** `react-day-picker` (calendario de shadcn) y el `popover` de shadcn.
- **API:** `POST /events`, `POST /events/:id/cancel` y `POST /users`, ya disponibles en `ticket-api`; el listado usa `GET /events`.
- **Pruebas:** el servidor simulado gana las rutas de creación y cancelación de eventos y de usuarios.
