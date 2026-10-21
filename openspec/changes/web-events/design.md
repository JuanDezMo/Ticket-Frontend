## Context

`web-foundation` dejó listos el cliente HTTP, los errores por tabla, la sesión en Zustand, las guardas y el patrón de feature (`features/auth`). Contrato de la API que usa esta iteración (`ticket-api`, `docs/architecture.md` §11):

- `GET /events?page&pageSize&status&type&startFrom&startTo&search` → `{ data: Event[], meta: { page, pageSize, total, totalPages } }`. `pageSize` va de 1 a 20; `startFrom` y `startTo` son ISO 8601 con zona. Un `page` fuera de rango devuelve `data` vacío, no un error.
- `GET /events/:id` → `Event`. Es público. Responde `404 EVENT_NOT_FOUND` si no existe y `400` si el id no es UUID.
- `GET /events/:id/seats` → `{ eventId, data: [{ id, row, number, label, status }] }`, ordenado por fila y número. Exige token. Antes de responder, libera las reservas vencidas.

## Goals / Non-Goals

**Goals:**
- Dos features nuevas que repiten el patrón de `auth`, sin agregar abstracciones.
- Que el estado del listado viva en la URL, así se puede compartir y funciona con atrás y adelante.

**Non-Goals:**
- Persistir la selección de seat: vive en memoria y se pierde al recargar. La reserva en curso, que sí se persiste, llega en `web-purchase`.
- Virtualizar el mapa de seats: son 260 como máximo.

## Decisions

### 1. Dos features: `events` y `seats`
- `features/events`: listado, filtros, detalle y página de detalle.
- `features/seats`: mapa de seats. Expone `SeatMap` en su `index.ts`, y `EventDetailPage` lo importa de ahí, como exigen las reglas de capas.
- *Alternativa:* todo dentro de `events`. Se descarta porque `web-purchase` va a reutilizar el mapa para seleccionar, y separarlo ahora evita mover archivos después.

### 2. Filtros en la URL con un parser propio
`features/events/filters.ts` tiene dos funciones puras:
- `parseFilters(searchParams)`: valida cada campo por separado con zod `safeParse` y descarta el que sea inválido, sin romper los demás.
- `toSearchParams(filters)`: omite los valores vacíos.

El hook `useEventFilters()` (en `hooks.ts`) envuelve `useSearchParams` y expone `{ filters, setFilter(name, value), setPage(n), clear() }`. `setFilter` siempre reinicia `page` a 1.

En la URL las fechas van como `YYYY-MM-DD`, la fecha del calendario. Se convierten a ISO justo antes de llamar a la API, con `startOfDay` y `endOfDay` de date-fns en la hora local.
- *Alternativa:* guardar los filtros en Zustand. Se descarta porque se perderían al recargar y no se podrían compartir.
- *Alternativa:* nuqs. Se descarta: es una dependencia más para cinco parámetros.

### 3. Búsqueda con debounce
El campo de búsqueda guarda lo que escribe el usuario en `useState`. `useDebouncedValue(value, 300)` (en `shared/lib/use-debounced-value.ts`) actualiza la URL cuando el usuario deja de escribir; así hay una consulta y una entrada en el historial por búsqueda, no una por tecla. Si la URL cambia desde afuera (atrás, "Clear filters"), el campo se sincroniza.

### 4. Claves de consulta y caché
`features/events/query-keys.ts`:
- `eventKeys.list(params)` → `['events', 'list', params]`
- `eventKeys.detail(id)` → `['events', 'detail', id]`

`features/seats/query-keys.ts`:
- `seatKeys.byEvent(id)` → `['seats', id]`

El listado usa `placeholderData: keepPreviousData` para que la página no parpadee al cambiar de página o de filtro. Los seats usan `staleTime: 0`, porque cambian seguido, y el botón "Refresh" llama a `refetch()`.

### 5. Validar el id antes de consultar
`EventDetailPage` valida `:id` con `z.uuid()`. Si no es válido, muestra "Event not found" sin llamar a la API. `useEvent(id)` solo se habilita con un id válido, y el `404` de la API muestra la misma vista.

### 6. Seats solo con sesión
`useEventSeats(eventId)` usa `enabled: !!role`. Sin sesión, `SeatMap` no se monta y en su lugar aparece `SignInToSeeSeats`, con un enlace `loginPathWithRedirect('/events/<id>')`. La redirección después del login ya funciona gracias a `GuestOnly`.

### 7. Agrupar seats y estilos por tabla
- `features/seats/seat-rows.ts`: `groupSeatsByRow(seats)` → `{ row, seats }[]`, que respeta el orden de la API. Es pura y se prueba sola.
- `SEAT_STATUS_STYLE: Record<SeatStatus, { label, className }>` define el texto de la leyenda y las clases de Tailwind.
- Cada seat es un elemento con `role="img"` y `aria-label="Seat A1, Available"`. No es un botón todavía; la selección llega en `web-purchase`.

### 8. Formato de fechas y dinero en `shared/lib`
- `format-date.ts`:
  - `formatDateTime(iso)`, con `format(parseISO(iso), 'PPp')` de date-fns (por ejemplo "Dec 1, 2026, 8:00 PM", en hora local);
  - `formatDateRange(start, end)`.
- `format-money.ts`: `formatMoney(amount)` con `Intl.NumberFormat('en-US', { style: 'currency', currency: env.currency, maximumFractionDigits: 2 })`.
- `env.currency` sale de `VITE_CURRENCY`, por defecto `USD`, que es la moneda acordada. La API envía `price` y `amount` como número en esa moneda, sin conversión.

### 9. "Back to events" conserva los filtros
Un segundo store de Zustand, `features/events/store.ts` (`useEventListStore`), guarda `lastSearch`: el query string del último listado que vio el usuario (`?type=CONCERT&page=2`).
- `EventsPage` lo actualiza con `useEffect` cada vez que cambia `location.search`.
- `EventDetailPage` arma el enlace `/${lastSearch}`.
- Se persiste con `persist` en `sessionStorage`, así sobrevive a una recarga y a una pestaña nueva de la misma sesión, pero no se comparte entre pestañas ni dura más que la sesión del navegador.

No se guardan datos del servidor; es estado del cliente, como manda la regla de estado.

- *Alternativa descartada:* el state del historial (`location.state`). Se pierde al pasar por el login, al recargar y al abrir una pestaña nueva.
- *Alternativa descartada:* el filtro en la URL del detalle (`?back=`). Sobrevive a todo, pero deja la URL del detalle larga y difícil de leer.
- *Alternativa descartada:* reenviar el state a través del login. Obliga a tocar `shared/session` para un caso de una sola feature.
- *Alternativa descartada:* `navigate(-1)`. Después del login vuelve al formulario de login.

### 10. Avisos con una función pura
`getEventNotice(event, now)` devuelve `CANCELLED`, `STARTED` o `null`, y una tabla define el texto de cada uno. `now` llega como parámetro para que se pueda probar.

### 11. Selección de seat en Zustand
`features/seats/store.ts`, `useSeatSelectionStore`:
- Estado: `{ eventId, seatLabel }`.
- Acciones: `toggle(eventId, label)` y `clear()`.

`toggle` sobre el mismo seat lo deselecciona; sobre otro, lo reemplaza; en otro evento, reemplaza la selección anterior, porque solo se elige un seat a la vez.

Las reglas de cuándo se puede seleccionar viven en una función pura, `canSelectSeat(seat, { role, notice })`: solo un `USER`, solo seats `AVAILABLE` y solo si el evento no tiene aviso.

El hook `useSelectedSeat(eventId, seats)` deriva la selección vigente. Si el seat guardado ya no está `AVAILABLE` después de un "Refresh", llama a `clear()` y devuelve `null`, y la UI muestra "Your selected seat is no longer available".

Al cerrar o vencer la sesión, `Providers` limpia la selección junto con la caché. `seats/index.ts` exporta `clearSeatSelection`.

Los seats seleccionables son `button` con `aria-pressed`; los demás conservan `role="img"`. Así la decisión 7 cambia solo para los seats seleccionables.

- *Alternativa:* `useState` en la página. Se descarta porque `web-purchase` necesita la selección desde otro componente (el panel de reserva) y el usuario pidió Zustand.
- *Alternativa:* persistir en `sessionStorage`. Se descarta: una selección sin reservar no retiene el seat, así que recuperarla tras recargar no aporta.

### 12. Componentes de UI
Se agregan con shadcn `badge`, `skeleton` y `native-select`. `native-select` es el `<select>` nativo con estilos: accesible y fácil de probar. Las fechas usan `<input type="date">` con el `Input` existente; el selector de fecha de shadcn queda para `web-admin`.

### 13. Pruebas
- **Fixtures:** `src/test/fixtures/events.ts` con `makeEvent(overrides)` y `makeSeats(capacity, overrides)`.
- **Handlers de MSW por defecto:**
  - `GET /events` filtra y pagina un arreglo en memoria con los mismos parámetros que la API, para que las pruebas comprueben la consulta;
  - `GET /events/:id` devuelve `404 EVENT_NOT_FOUND` para un id desconocido;
  - `GET /events/:id/seats` devuelve `401` si no llega `Authorization`.
- **Funciones puras:** `parseFilters`, `toSearchParams`, `groupSeatsByRow`, `getEventNotice`, `canSelectSeat` y los formatos tienen pruebas unitarias.
- **Store:** se prueba directamente con `useSeatSelectionStore.getState()`.
- **Pantallas:** se prueban con `renderRoute`.

## Risks / Trade-offs

- [Hora del navegador frente a hora del servidor en el aviso "already started"] → es solo informativo; el backend decide al reservar (`409 EVENT_NOT_ACTIVE`).
- [Mapa desactualizado si otro usuario reserva] → botón "Refresh". Al reservar en `web-purchase`, `SEAT_NOT_AVAILABLE` refresca el mapa.
- [La API no indica la moneda] → la UI asume USD; se documenta en el README y en `docs/api-integration.md`.
- [Zona horaria en el filtro de fechas] → se envía con el offset local, así que "From 1 dic" significa la medianoche del 1 de diciembre en la hora del usuario, que es lo que espera.
