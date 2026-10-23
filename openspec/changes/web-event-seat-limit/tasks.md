## 1. Tipo, constante y errores

- [x] 1.1 Agregar `maxSeatsPerUser` al tipo `Event`, la constante `MAX_SEATS_PER_BUYER` (8) en `features/events/constants.ts` exportada por `index.ts`, y `SEAT_LIMIT_REACHED` a `ERROR_CODES` y a `ERROR_MESSAGES`. Verificar con `pnpm typecheck` y la prueba de `error-messages` (el código tiene mensaje propio)

## 2. Datos de prueba

- [x] 2.1 Actualizar `makeEvent` (`maxSeatsPerUser` 4, o la capacidad si es menor) y el handler de `POST /events` de MSW (`400` sin el campo o fuera de 1 a 8 o mayor que la capacidad; lo devuelve en la respuesta y el listado). Verificar con `pnpm test`: las pruebas existentes de eventos y admin siguen pasando

## 3. Crear evento

- [x] 3.1 Agregar el campo al esquema y a `toCreateEventRequest`. Verificar con pruebas unitarias con valores límite: **1 y 8 válidos**, **0 y 9 inválidos**, decimal, texto, vacío (obligatorio), mayor que la capacidad (5 con capacidad 4), igual a la capacidad (4 con 4) y 1 con capacidad 1
- [x] 3.2 Agregar el campo "Max seats per buyer" a `CreateEventForm` (vacío, `inputMode="numeric"`, nota de que no se puede cambiar, error junto al campo) y enviarlo. Verificar con pruebas de pantalla: abre vacío con la nota, errores de obligatorio, de rango (0 y 9) y de capacidad, aceptación de 1 y de 8, y la solicitud lleva `maxSeatsPerUser` como número

## 4. Presentación

- [x] 4.1 Mostrar "up to N per buyer" en `AdminEventRow`. Verificar con una prueba de pantalla del panel (evento de 25 seats y límite 4)
- [x] 4.2 Mostrar "Up to N seats per buyer" en `EventDetails` solo cuando N > 1, con o sin sesión. Verificar con pruebas con N = 1 (no aparece), 4 y 8

## 5. Documentación y cierre

- [x] 5.1 Actualizar `DESIGN.md` y `.impeccable/design.json` (campo del formulario, fila del panel y dato del encabezado) y `docs/api-integration.md` (pantallas de admin y validaciones). Verificar leyendo los archivos
- [ ] 5.2 Verificación contra `ticket-api` real: crear un evento con límite 1, 8, sin el campo y con 9 desde la UI y ver el límite en el panel y el detalle. Verificar con las respuestas esperadas y `pnpm check`
