## Why

Con la base lista (`web-foundation`), la página de inicio sigue siendo un placeholder. Esta iteración deja que cualquier persona encuentre eventos, y que un usuario con sesión vea qué seats quedan, que es el paso previo a reservar en `web-purchase`. `ticket-api` ya expone `GET /events`, `GET /events/:id` (cambio `event-detail`) y `GET /events/:id/seats`.

## What Changes

- **Listado público de eventos** en `/`, que reemplaza el placeholder:
  - tarjetas con nombre, tipo, lugar, fecha y hora locales, precio y estado;
  - paginación de 12 eventos por página;
  - estados de carga, vacío y error con reintento.
- **Filtros en la URL** (`status`, `type`, rango de fechas y búsqueda por nombre): se pueden compartir, sobreviven a una recarga y funcionan con atrás y adelante del navegador. Cambiar un filtro vuelve a la página 1.
- **Detalle del evento** en `/events/:id`, con `GET /events/:id`. Muestra un aviso si el evento está cancelado o ya empezó, y la página "Event not found" si no existe.
- **Mapa de seats** dentro del detalle, con `GET /events/:id/seats`:
  - filas `A`–`Z` de 10 puestos, cada uno con un color por estado y una leyenda;
  - cantidad de seats disponibles;
  - solo con sesión: un visitante ve "Sign in to see available seats", con un enlace que vuelve al evento.
- **Selección de seat** en el mapa, guardada en un store de Zustand (`features/seats/store.ts`). Un USER puede elegir un seat `AVAILABLE` de un evento activo y no iniciado, y ve "Selected seat: C7". El botón para reservar llega en `web-purchase`, que ya va a encontrar la selección en el store.
- La opción "Events" del encabezado lleva al listado real.

## Fuera de alcance

- Reservar el seat seleccionado, cuenta regresiva y checkout (`web-purchase`).
- Crear y cancelar eventos (`web-admin`).
- Actualización automática del mapa de seats (polling o tiempo real): se refresca al entrar o con un botón.
- Ordenar el listado por otro criterio: se usa el orden de la API (`startDate` ascendente).
- Precios por zona o por seat, imágenes de eventos y mapa del lugar.

## Capabilities

### New Capabilities

- `event-browsing`: listado público de eventos con paginación y filtros guardados en la URL.
- `event-detail`: detalle de un evento y su mapa de seats por estado.

### Modified Capabilities

Ninguna. `app-shell` todavía no está archivado; el cambio de la página de inicio queda dentro de `event-browsing`.

## Impact

- Código nuevo: `src/features/events/` y `src/features/seats/`. Cambian `src/app/routes.tsx` (`/` y `/events/:id`) y `src/app/pages.tsx` (se quita `HomePage`).
- Compartido: `src/shared/lib/format-date.ts`, `src/shared/lib/format-money.ts` y componentes de shadcn/ui (`badge`, `skeleton`, `native-select`).
- Dependencia nueva: `date-fns`.
- Precios en USD: `VITE_CURRENCY` (por defecto `USD`).
- Store nuevo de Zustand: `features/seats/store.ts` (seat seleccionado).
- Requiere `ticket-api` con `GET /events/:id` (cambio `event-detail`, ya implementado).
