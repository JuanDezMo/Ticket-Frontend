## 1. Preparación

- [x] 1.1 Instalar `date-fns` y agregar con shadcn `badge`, `skeleton` y `native-select` en `src/shared/ui`. Corregir el import de `cn` a `@/shared/lib/utils` y quitar `"use client"`, como en `web-foundation`. Verificar con `pnpm typecheck` y `pnpm lint`
- [x] 1.2 Agregar `VITE_CURRENCY=USD` a `.env.example` y `currency` a `src/shared/config/env.ts`, y documentarla en el README. Verificar con `pnpm typecheck`
- [x] 1.3 Agregar `ROUTES.eventDetail = (id: string) => \`/events/${id}\`` y el patrón `ROUTES.eventDetailPattern = '/events/:id'` en `src/shared/config/routes.ts`. Verificar con `pnpm typecheck`

## 2. Utilidades compartidas

- [x] 2.1 Crear `src/shared/lib/format-date.ts` (`formatDateTime`, `formatDateRange`) y `format-money.ts` (`formatMoney`), según la decisión 8. Verificar con pruebas unitarias: una fecha ISO UTC se muestra en la hora local fijando `TZ` en la prueba, y `150000` se muestra como `$150,000.00` en USD
- [x] 2.2 Crear `src/shared/lib/use-debounced-value.ts`. Verificar con una prueba con timers falsos: el valor solo cambia 300 ms después del último cambio

## 3. Fixtures y red simulada

- [x] 3.1 Crear `src/test/fixtures/events.ts` con `makeEvent(overrides)` y `makeSeats(capacity, statusByLabel?)`, que genera las filas `A`.. de 10 igual que la API. Verificar con una prueba: `makeSeats(25)` da 25 seats y la fila `C` tiene 5
- [x] 3.2 Agregar a `src/test/msw/handlers.ts` los handlers de la decisión 13:
  - `GET /events` filtra por `status`, `type`, `search` (que contiene, sin distinguir mayúsculas), `startFrom` y `startTo` sobre un arreglo, y pagina con `page` y `pageSize`;
  - `GET /events/:id` responde con el evento o `404 EVENT_NOT_FOUND`;
  - `GET /events/:id/seats` exige `Authorization` y responde `401 UNAUTHORIZED` sin él.

  Exportar `setEvents(list)` y `setSeats(eventId, seats)` para que cada prueba cargue sus datos, y reiniciarlos en `afterEach` de `src/test/setup.ts`. Verificar con `pnpm test`: las pruebas existentes siguen pasando

## 4. Feature `events`: datos y filtros

- [x] 4.1 Crear `src/features/events/types.ts` (`EVENT_STATUSES`, `EVENT_TYPES` y sus tipos, `Event`, `EventPage`, `EventFilters`) y `constants.ts` (`EVENTS_PAGE_SIZE = 12`, más las etiquetas visibles de tipos y estados en una tabla `Record`). Verificar con `pnpm typecheck`
- [x] 4.2 Crear `src/features/events/filters.ts` con `parseFilters(searchParams)`, `toSearchParams(filters)`, `toApiQuery(filters, page)` (convierte las fechas con `startOfDay`/`endOfDay` y agrega `pageSize`) y `isDateRangeValid(filters)`. Verificar con pruebas unitarias:
  - valores válidos;
  - `type=FESTIVAL` y `page=abc` se ignoran;
  - `page=0` se ignora;
  - las fechas se convierten a ISO con offset local;
  - los valores vacíos no se escriben en la URL;
  - un rango invertido es inválido
- [x] 4.3 Crear `src/features/events/api.ts` (`list(query)`, `getById(id)`) y `query-keys.ts`. Verificar con `pnpm arch`: `api.ts` no importa React
- [x] 4.4 Crear `src/features/events/hooks.ts` con:
  - `useEventFilters()` (decisión 2);
  - `useEvents(filters, page)`, con `keepPreviousData` y sin consultar si el rango es inválido;
  - `useEvent(id)`, solo si el id es UUID.

  Verificar con pruebas con `renderHook` y MSW: `setFilter` reinicia la página a 1, y `useEvents` envía `pageSize=12` y los filtros

## 5. Feature `events`: listado

- [x] 5.1 Crear `components/EventCard.tsx`: nombre, tipo, lugar, `formatDateTime`, `formatMoney` y un `Badge` "Cancelled" si corresponde. Debe ser un enlace al detalle con `state.search`. Verificar con una prueba: un evento cancelado muestra "Cancelled" y el enlace apunta a `/events/<id>`
- [x] 5.2 Crear `components/EventFilters.tsx`: selects de estado y tipo, "From" y "To", búsqueda con debounce, "Clear filters" y el error "'From' must be before 'To'". Solo recibe `filters` y callbacks por props. Verificar con una prueba: escribir "rock" produce una sola llamada a `onSearch`, y con un rango invertido aparece el error
- [x] 5.3 Crear `components/Pagination.tsx` ("Page X of Y", "Previous" y "Next", deshabilitados en los límites). Verificar con una prueba de los límites
- [x] 5.4 Crear `components/EventList.tsx` con sus estados: carga (skeletons), vacío ("No events found", y "Go to first page" si `page > 1`), error con "Try again" y la grilla de tarjetas. Verificar con pruebas de cada estado
- [x] 5.5 Crear `pages/EventsPage.tsx`, que une `useEventFilters`, `useEvents`, `EventFilters`, `EventList` y `Pagination`. Verificar con pruebas de pantalla con `renderRoute('/')`:
  - un visitante ve los eventos;
  - "Next" cambia la URL a `page=2`;
  - elegir "Concert" envía `type=CONCERT&page=1`;
  - `/?type=MEETUP&status=ACTIVE&page=2` muestra los filtros seleccionados;
  - atrás restaura el filtro anterior;
  - "Clear filters" limpia la URL

## 6. Feature `events`: detalle

- [x] 6.1 Crear `src/features/events/event-notice.ts` con `getEventNotice(event, now)` y su tabla de mensajes. Verificar con pruebas unitarias: un evento cancelado, uno ya iniciado, uno futuro activo y uno cancelado y además iniciado (debe ganar el cancelado)
- [x] 6.2 Crear `components/EventDetails.tsx` (datos completos, capacidad y aviso) y `pages/EventDetailPage.tsx`:
  - valida el UUID;
  - "Event not found" ante un id inválido o un `404`;
  - "Back to events" con `state.search`;
  - renderiza `SeatMap` o `SignInToSeeSeats` según la sesión.

  Verificar con pruebas de pantalla:
  - un visitante ve el detalle;
  - `/events/abc` muestra "Event not found" sin llamar a la API (handler que falla la prueba si se llama);
  - un `404` muestra "Event not found";
  - un evento cancelado muestra su aviso;
  - "Back to events" vuelve con los filtros
- [x] 6.3 Exponer `EventsPage` y `EventDetailPage` en `src/features/events/index.ts`. Verificar con `pnpm arch`

## 7. Feature `seats`: mapa

- [x] 7.1 Crear `src/features/seats/types.ts` (`SEAT_STATUSES`, `Seat`, `SeatList`), `api.ts` (`listByEvent(eventId)`), `query-keys.ts` y `hooks.ts` (`useEventSeats(eventId)`, con `enabled: !!role` y `staleTime: 0`). Verificar con una prueba de `renderHook`: sin sesión no hay solicitud y con sesión envía el token
- [x] 7.2 Crear `seat-rows.ts` con `groupSeatsByRow` y `seat-status-style.ts` con `SEAT_STATUS_STYLE`. Verificar con pruebas unitarias: 25 seats dan las filas A(10), B(10) y C(5), y la tabla tiene una entrada por cada estado
- [x] 7.3 Crear `components/SeatMap.tsx`: filas con su letra, seats con `role="img"` y `aria-label="Seat A1, Available"`, la leyenda, "X of Y seats available", "Refresh" y los estados de carga y de error con "Try again", y `components/SignInToSeeSeats.tsx`. Verificar con pruebas:
  - 25 seats en 3 filas;
  - el nombre accesible incluye el estado;
  - "18 of 20 seats available";
  - "Refresh" vuelve a consultar;
  - un `500` muestra el mensaje genérico sin ocultar el detalle del evento
- [x] 7.4 Crear `src/features/seats/store.ts` (`useSeatSelectionStore` con `toggle` y `clear`) y `can-select-seat.ts` (`canSelectSeat`), según la decisión 11. Verificar con pruebas unitarias:
  - `toggle` del mismo seat deselecciona;
  - `toggle` de otro seat lo reemplaza;
  - `toggle` en otro evento reemplaza la selección anterior;
  - `canSelectSeat` es `false` para un ADMIN, para un seat que no está `AVAILABLE` y para un evento con aviso
- [x] 7.5 Agregar a `hooks.ts` `useSelectedSeat(eventId, seats)`, que limpia la selección si el seat ya no está `AVAILABLE`. En `SeatMap`, los seats seleccionables son `button` con `aria-pressed`. Mostrar "Selected seat: C7" y "Your selected seat is no longer available". Verificar con pruebas de pantalla de los escenarios del requisito "Selección de un seat", incluido que la selección se conserva al volver al evento
- [x] 7.6 Exponer `SeatMap`, `SignInToSeeSeats` y `clearSeatSelection` en `src/features/seats/index.ts`. En `src/app/providers.tsx`, llamar a `clearSeatSelection()` cuando termina la sesión. Verificar con `pnpm arch` y con una prueba: después de `signOut()` el store queda vacío

## 8. Integración en la app

- [x] 8.1 En `src/app/routes.tsx`, la ruta índice usa `EventsPage` y se agrega `ROUTES.eventDetailPattern` con `EventDetailPage` (pública). Quitar `HomePage` de `src/app/pages.tsx` y actualizar las pruebas que esperaban el placeholder (`smoke.test.tsx`, `routes.test.tsx`). Verificar con `pnpm test`
- [x] 8.2 Prueba de integración del flujo: un visitante abre `/`, filtra por "Concert", abre un evento, ve "Sign in to see available seats", inicia sesión desde el enlace, vuelve al evento y ve el mapa. Luego "Back to events" conserva el filtro. Verificar que pasa con `pnpm test`

## 9. Cierre

- [x] 9.1 Actualizar el README (variable `VITE_CURRENCY`, precios en USD) y `docs/api-integration.md` (las pantallas de eventos y seats ya implementadas). Verificar leyendo ambos documentos
- [ ] 9.2 Verificación manual contra `ticket-api` real con `docker compose up -d --build`. Crear 2 o 3 eventos con el ADMIN por curl, uno cancelado. Luego probar en el navegador:
  - el listado, los filtros, la paginación con más de 12 eventos y atrás y adelante;
  - el detalle;
  - el mapa como USER, con selección y deselección de un seat;
  - el aviso de evento cancelado.

  Verificar que `pnpm check` y `pnpm build` pasan
