## Context

- **Backend listo** (`ticket-api`, `docs/architecture.md` §11): `POST /events` (`201`), `POST /events/:id/cancel` (`200` con `cancelledReservations` y `cancelledTickets`) y `POST /users` (`201`), los tres solo para ADMIN. El listado reutiliza `GET /events`, que ya devuelve activos y cancelados.
- **Reglas de la API que la UI repite** (`docs/business-rules.md`): `name`, `description` y `venue` obligatorios; `price` mayor a 0; `capacity` entera de 1 a 260 (no cambia después); `startDate` futura y `endDate` posterior; contraseña de 8 a 128 caracteres; los seats se generan en filas `A` a `Z` de 10.
- **Frontend listo:** la tabla de mensajes por código (ya incluye `EMAIL_ALREADY_EXISTS`, `EVENT_ALREADY_CANCELLED`, `EVENT_ALREADY_ENDED` y `VALIDATION_ERROR`), `RequireRole`, el `alert-dialog`, el `Pagination` compartido, el patrón de formularios con react-hook-form y zod (`features/auth`), `setFormApiError`, y el lenguaje visual de `DESIGN.md`.
- **Hoy** `/admin` muestra un placeholder en `src/app/pages.tsx` y el encabezado del ADMIN ya enlaza a él. El mapa de seats lo ve un ADMIN pero sin pase de selección.

## Goals / Non-Goals

**Goals:**
- Que un administrador cree un evento sin equivocarse con la capacidad ni las fechas, y vea cuántos seats se van a generar antes de enviar.
- Que cancelar un evento sea una decisión informada y quede claro su alcance.

**Non-Goals:**
- Una capa de permisos más fina que el rol (la API solo conoce `USER` y `ADMIN`).
- Ocultar la información de administración a un USER con trucos de CSS: el acceso lo decide `RequireRole` y, por encima, la API.

## Decisions

### 1. Una feature nueva y la dirección de dependencias
`features/admin` con páginas, formularios, hooks y API propios. Importa de `events` (lista, claves de caché, tipos y etiquetas), de `seats` (vista previa y `seatKeys`) y de `auth` (límites de contraseña) solo por sus `index.ts`. El orden queda `admin → events → seats → reservations`, sin ciclos (lo comprueba dependency-cruiser). Ninguna otra feature importa de `admin`.
- *Alternativa:* poner "Cancel event" en el detalle público del evento. Se descarta: obligaría a `events` a importar de `admin` y mezcla la administración con la pantalla del comprador.

### 2. Rutas
`/admin` (panel), `/admin/events/new` y `/admin/users/new`, las tres con `RequireRole` ADMIN. Se agregan `ROUTES.adminNewEvent` y `ROUTES.adminNewUser`. El `AdminPage` placeholder se elimina de `src/app/pages.tsx`. El encabezado no cambia (el ADMIN sigue viendo "Events" y "Admin"); desde el panel salen los accesos a crear.

### 3. Panel: la lista de eventos se reutiliza
`AdminPage` usa `useEvents` y `useEventFilters` de `events` con filtros vacíos y la página en la URL, y el `Pagination` compartido. Cada fila es un Laminate (sin anidar) con nombre (enlace al detalle), fecha, lugar, precio, capacidad, `EventStatusBadge`-equivalente de estado y la acción de cancelar. Sin sesión de ADMIN no se hace ninguna consulta de más: `GET /events` ya es público.

### 4. Vista previa de seats en `seats`, calculada en el cliente
`seats` exporta `SeatPreview({ capacity })`: genera `capacity` seats `AVAILABLE` con la misma regla que la API (filas de 10 desde la `A`, última fila incompleta), los agrupa con `groupSeatsByRow` y los dibuja con `SeatTile` no seleccionable (`role="img"`), así hereda formas y colores sin duplicarlos. La rejilla de columnas (`ROW_GRID`) se extrae de `SeatMap` a una constante compartida dentro de `seats`. Se oculta si la capacidad no es un entero de 1 a 260 y lleva el resumen "<N> seats in <R> rows".
- No llama a la API: los seats solo existen cuando el evento se crea.
- *Alternativa:* un componente de vista previa dentro de `admin`. Se descarta porque duplicaría `SeatTile` y la rejilla, que ya son de `seats`.

### 5. Fechas con calendario y hora
Se agrega `react-day-picker` (el calendario de shadcn) y el `popover` de shadcn a `shared/ui`, y un `DateTimeField` (calendario más `<input type="time">`) que entrega un `Date` local. Al enviar se convierte con `toISOString()` (UTC), que es lo que espera la API. El calendario se abre en un `popover` de 44 px de objetivo en móvil.
- *Alternativa:* `<input type="datetime-local">` nativo, sin dependencia. Es más simple y accesible, pero su aspecto varía por navegador y no sigue el sistema de diseño; el plan de iteraciones ya contemplaba `react-day-picker`. Si el calendario resultara costoso de mantener, el campo se aísla en un solo componente y se puede cambiar sin tocar el resto.

### 6. Formulario de evento
react-hook-form con `zodResolver`; los campos numéricos viven como texto en el formulario y `toCreateEventRequest` los convierte al enviar (precio con `Number`, capacidad con `parseInt`). El esquema (`schemas.ts`) valida lo mismo que la API y agrega mensajes por campo: "Start must be in the future", "End must be after start", "Price must be greater than 0", "Capacity must be a whole number from 1 to 260". La capacidad se observa con `watch` para alimentar la vista previa. Un error de la API se muestra con `setFormApiError` (`VALIDATION_ERROR` en el formulario). El botón queda bloqueado mientras envía y una guarda impide la doble solicitud (mismo patrón que `usePurchase`).

### 7. Cancelar un evento
`useCancelEvent` (mutación sin reintentos) envía `POST /events/:id/cancel`. La confirmación es un `alert-dialog` que dice qué se cancela y que no se deshace. Al terminar invalida `eventKeys.all`, `seatKeys.byEvent(id)` y el detalle, y muestra un `toast` con los conteos de la respuesta ("Event cancelled: 4 reservations and 12 tickets cancelled", con singular y plural). Los `409` (`EVENT_ALREADY_CANCELLED`, `EVENT_ALREADY_ENDED`) muestran su mensaje y vuelven a leer la lista, porque otro administrador pudo haberlo cancelado. Se ofrece solo si `status` es `ACTIVE` y `endDate` es futura (`canCancelEvent`); es una ayuda de la UI, la API decide.

### 8. Crear usuario
`createUserSchema` (email, contraseña de 8 a 128 con los límites que exporta `auth`, y rol de `USER`/`ADMIN`) y `useCreateUser`. El rol se elige con el `NativeSelect` ya existente, sin valor por defecto, para que crear un administrador sea una decisión explícita. Con éxito se muestra un `toast` y el formulario se reinicia; con error se vacía la contraseña y se conserva lo demás. La contraseña no se guarda en ninguna caché: la mutación se reinicia al terminar, como la tarjeta del checkout (`gcTime: 0` y `reset()`).

### 9. Servidor simulado y pruebas
- **MSW:** handlers para `POST /events` (valida lo básico y agrega el evento a la "base" en memoria, de modo que el listado y el detalle lo vean), `POST /events/:id/cancel` (cambia el estado y devuelve los conteos, con `409` si ya estaba cancelado o terminó) y `POST /users` (`409` con un email repetido). Se exponen `setAdminData` y `resetAdminData` y se reinician en `setup.ts`.
- **Tiempo:** el "futuro" de las fechas se prueba con fechas relativas a `Date.now()`, sin relojes falsos.
- **Seguridad:** una prueba comprueba que, tras crear un usuario, la contraseña no está en el almacenamiento ni en la caché de consultas.

## Risks / Trade-offs

- [El administrador crea un evento con la capacidad equivocada y no se puede cambiar] → la vista previa y el resumen "<N> seats in <R> rows" se muestran antes de enviar; el formulario no tiene valores por defecto en la capacidad.
- [Cancelar por error un evento con tickets vendidos] → confirmación explícita que nombra el alcance, botón destructivo, y el resultado dice cuántas reservas y tickets se afectaron. No hay reembolso (fuera de alcance), y la UI no lo promete.
- [Zona horaria del administrador distinta a la del público] → las fechas se muestran en la zona del navegador (como en el resto de la UI) y se envían en UTC; el formulario muestra la zona usada junto al campo.
- [Un USER abre una ruta de admin por URL] → `RequireRole` muestra "sin permiso" y la API responde `403`; no se confía en ocultar enlaces.
- [`react-day-picker` suma peso al bundle] → solo se carga en las pantallas de admin (la ruta se carga de forma diferida con `React.lazy`), de modo que no afecta al comprador.
- [Alcance] → crear usuario es independiente de los eventos; si hiciera falta, puede salir como un cambio aparte sin afectar al resto.
