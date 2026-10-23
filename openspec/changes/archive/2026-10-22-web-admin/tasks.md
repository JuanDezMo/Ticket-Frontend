## 1. Preparación

- [x] 1.1 Agregar `react-day-picker` y los componentes `calendar` y `popover` de shadcn a `src/shared/ui` (imports de `cn` desde `@/shared/lib/utils`, sin `"use client"`) y crear `DateTimeField` (calendario más hora, entrega un `Date` local) con su prueba. Verificar con la prueba: elegir un día y una hora entrega la fecha esperada, el campo se opera con teclado y `pnpm arch` pasa
- [x] 1.2 Agregar `ROUTES.adminNewEvent` y `ROUTES.adminNewUser` a `src/shared/config/routes.ts` y exportar por `index.ts` lo que `admin` necesita: de `events` (`useEvents`, `useEventFilters`, `eventKeys`, `EVENT_TYPE_LABELS`, `EVENT_TYPE_VALUES`, `EVENT_STATUS_LABELS` y el tipo `Event`) y de `auth` (`MIN_PASSWORD_LENGTH`, `MAX_PASSWORD_LENGTH`). Verificar con `pnpm typecheck` y `pnpm arch`

## 2. Servidor simulado

- [x] 2.1 Agregar a `src/test/msw/` los handlers de `POST /events`, `POST /events/:id/cancel` (conteos, `409 EVENT_ALREADY_CANCELLED` y `EVENT_ALREADY_ENDED`) y `POST /users` (`409 EMAIL_ALREADY_EXISTS`), con `setAdminData` y `resetAdminData` reiniciados en `setup.ts`, y `makeEvent` ya reutilizable para el listado. Verificar con `pnpm test`: las pruebas existentes siguen pasando

## 3. Vista previa de seats (`seats`)

- [x] 3.1 Extraer `ROW_GRID` de `SeatMap` a una constante compartida dentro de `seats`, crear `preview-seats.ts` (genera los seats con la regla de la API) y `components/SeatPreview.tsx` (filas con `SeatTile` no seleccionable y el resumen "<N> seats in <R> rows"), y exportarlo en `index.ts`. Verificar con pruebas: 25 seats dan 3 filas con la última de 5, 260 dan 26 filas, 0, 300 y no numérico no muestran nada y los seats no son enfocables; las pruebas del mapa siguen pasando

## 4. Feature `admin`: datos

- [x] 4.1 Crear `types.ts` (solicitudes y respuestas de crear evento, cancelar evento y crear usuario), `api.ts` (`createEvent`, `cancelEvent`, `createUser`) y `hooks.ts` (`useCreateEvent`, `useCancelEvent` y `useCreateUser`, mutaciones sin reintentos que invalidan `eventKeys.all` y `seatKeys.byEvent`; la de usuario no conserva la contraseña: `gcTime: 0` y `reset()`). Verificar con `pnpm arch` (`api.ts` no importa React) y pruebas con MSW de cada mutación

## 5. Crear evento

- [x] 5.1 Crear `schemas.ts` con `eventFormSchema` y `toCreateEventRequest` (precio y capacidad a número, fechas a UTC). Verificar con pruebas unitarias: precio 0, capacidad 0, 1, 260 y 261, capacidad decimal, inicio en el pasado, fin anterior al inicio y campos vacíos
- [x] 5.2 Crear `components/CreateEventForm.tsx` (react-hook-form, `DateTimeField` de inicio y fin, `NativeSelect` de tipo, vista previa con la capacidad observada, "Creating...", una sola solicitud con doble pulsación, `VALIDATION_ERROR` en el formulario conservando lo escrito) y `pages/CreateEventPage.tsx` (con éxito: `toast` "Event created" y navegación al detalle). Verificar con pruebas de pantalla: validaciones, la vista previa cambia al escribir la capacidad, envío con fechas en UTC, doble pulsación y error del servidor
- [x] 5.3 Registrar `/admin/events/new` en `routes.tsx` con `RequireRole` ADMIN. Verificar con pruebas de acceso: USER ve "sin permiso" y el visitante va al login con regreso

## 6. Panel de eventos y cancelación

- [x] 6.1 Crear `canCancelEvent` (`ACTIVE` y fin futuro) y `components/AdminEventRow.tsx` (Laminate con nombre enlazado, fecha, lugar, precio, capacidad, estado y acción), y `pages/AdminPage.tsx` con la página en la URL, los estados de carga, vacío ("No events yet" y "Create event") y error ("Try again"), la paginación solo con más de una página y los accesos "Create event" y "Create user". Reemplazar el placeholder: quitarlo de `src/app/pages.tsx` y cargar la ruta de forma diferida. Verificar con pruebas de pantalla de los escenarios del spec, incluido el acceso de un USER
- [x] 6.2 Crear `components/CancelEvent.tsx` con el `alert-dialog` (qué se cancela y que no se deshace), una sola solicitud, botón deshabilitado mientras envía y `toast` con los conteos en singular y plural; los `409` muestran su mensaje y actualizan la lista. Verificar con pruebas: confirma y cancela, cierra el diálogo sin enviar, doble confirmación envía una sola solicitud, `EVENT_ALREADY_CANCELLED`, `EVENT_ALREADY_ENDED`, y no se ofrece en eventos cancelados ni terminados

## 7. Crear usuario

- [x] 7.1 Crear `createUserSchema` y `components/CreateUserForm.tsx` (email, contraseña y rol sin valor por defecto, "Creating...", una sola solicitud, `EMAIL_ALREADY_EXISTS` junto al email conservando email y rol y vaciando la contraseña, formulario vacío tras crear con "User created: <email> (<rol>)") y `pages/CreateUserPage.tsx`; registrar `/admin/users/new` con `RequireRole` ADMIN. Verificar con pruebas: validación en el cliente, rol obligatorio, creación de USER y de ADMIN, email repetido, fallo de red y acceso de USER y visitante

## 8. Seguridad, documentación y cierre

- [x] 8.1 Prueba de no persistencia de la contraseña: crear un usuario y comprobar que no está en `localStorage`, `sessionStorage` ni en `queryClient.getQueryCache()` y `getMutationCache()`. Verificar que pasa con `pnpm test`
- [x] 8.2 Prueba de integración del flujo del administrador: iniciar sesión como ADMIN, crear un evento (con vista previa), verlo en el panel y en el detalle, cancelarlo y ver el estado y el aviso en el detalle; y un USER que lo reserva antes ve el seat liberado. Verificar con `pnpm test`
- [x] 8.3 Actualizar `DESIGN.md` y `.impeccable/design.json` (fila del panel, formulario de evento con vista previa, diálogo de cancelación, campo de fecha) y `docs/api-integration.md` (pantallas de admin implementadas). Verificar leyendo ambos
- [x] 8.4 Capturas de móvil (390) y escritorio (1440) en claro y oscuro del panel, el formulario de evento (con vista previa y con errores), el diálogo de cancelación y el formulario de usuario en `.impeccable/review/`, y `impeccable detect`. Verificar que no hay recortes ni hallazgos de código
- [x] 8.5 Verificación manual contra `ticket-api` real con un ADMIN: crear un evento de 25 seats y comprobar que la API genera 25 (filas A a C), cancelar un evento con una reserva activa y ver los conteos, crear un USER y un ADMIN, e iniciar sesión con cada uno. Verificar `pnpm check` y `pnpm build`
