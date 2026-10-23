## 1. API, errores y datos de prueba

- [x] 1.1 `reservationsApi.create(eventId, seats)` con el cuerpo `{ eventId, seats }` y la respuesta `{ reservations }`; agregar `HOLD_LIMIT_REACHED` a `ERROR_CODES` y a `ERROR_MESSAGES`. Verificar con `pnpm typecheck` y la prueba de `error-messages` (el código tiene mensaje propio)
- [x] 1.2 Handler de MSW de `POST /reservations` con el contrato nuevo (lote todo o nada, `seat` → `400`, `SEAT_NOT_AVAILABLE`, `SEAT_LIMIT_REACHED`, `HOLD_LIMIT_REACHED`) y `makeReservation`/helpers de prueba. Verificar con pruebas del handler: lote de 2, seat ocupado en el lote (no reserva ninguno), límite del evento con valores 1 y 8, y tope de 8 entre eventos

## 2. Reservas en curso (lista)

- [x] 2.1 `useHoldStore` con `holds`, `add`, `remove`, `clear`, `persist` en `version: 2` con `migrate`. Verificar con pruebas: agrega un lote sin duplicados, `remove` quita solo una, y un valor guardado con la forma anterior (con reserva y con `hold: null`) pasa a lista sin fallar
- [x] 2.2 `useReserveSeats` (mutación del lote) y `useHolds` (valida cada reserva, descarta una a una, ordena por `expiresAt`). Verificar con pruebas de hooks: dos reservas donde una está `EXPIRED`, una con `404`, y el orden por vencimiento

## 3. Selección múltiple

- [x] 3.1 `seatAllowance` (límite − reservas en curso del evento). Verificar con pruebas unitarias: máximo 1 y 8, con 0, 1 y todas retenidas, y reservas de otro evento que no cuentan
- [x] 3.2 `useSeatSelectionStore` con lista, `toggle` con cupo (quita, reemplaza con cupo 1, no agrega con el cupo lleno) y `useSelectedSeats` (quita los seats no disponibles y los avisa). Verificar con pruebas de la tienda y del hook: cupo 1 reemplaza, cupo 3 llena al cuarto, cambiar de evento reemplaza, varios seats perdidos conservan los demás

## 4. Reservar

- [x] 4.1 `useReserveSelection` envía una sola solicitud con la lista, guarda las reservas, limpia, actualiza el mapa y lleva al checkout de la primera; maneja `SEAT_NOT_AVAILABLE`, `SEAT_LIMIT_REACHED` (mensaje con el límite del evento), `HOLD_LIMIT_REACHED`, `EVENT_NOT_ACTIVE` y red. Verificar con pruebas de pantalla (`reserve.test.tsx`): lote de 2, doble pulsación, un seat tomado (deja el otro), límite del servidor con N tomado de `maxSeatsPerUser`, tope global y fallo de red

## 5. Interfaz

- [x] 5.1 `SeatMap`: selección múltiple con el cupo, texto previo ("Pick up to N seats..."), foco al primer seleccionado y aviso "You can select up to N seats". Verificar con `seat-map.test.tsx`: varios seats, cupo lleno sin seleccionar, máximo 1, teclado (Enter y Espacio) y seats perdidos
- [x] 5.2 `SelectionPass` (ancho y compacto): códigos, total, "Reserve N seats", "k of N seats selected", sin cupo con "Continue to checkout", y "+N" en móvil. Verificar con pruebas de pantalla con 1, 2 y 8 seats, y con cupo agotado
- [x] 5.3 `HoldBanner` con varias reservas ("3 seats held", vencimiento más próximo, enlace a la primera). `CheckoutPage` y `CancelReservation` quitan solo su reserva (`removeHold`); `providers.tsx` limpia todo al cerrar sesión. Verificar con pruebas del aviso, del checkout y de la cancelación (la otra reserva sigue)

## 6. Documentación y cierre

- [x] 6.1 Actualizar `DESIGN.md` y `.impeccable/design.json` (pase con lista y total, aviso con varias reservas) y `docs/api-integration.md` (reservas por lote). Verificar leyendo los archivos y `pnpm check`
- [x] 6.2 Verificación contra `ticket-api` real (solo la parte de reservas): reservar 1 y 8 seats desde la UI, intentar el seat 9 y un seat ocupado, ver el aviso con varias reservas y cancelar una. Verificar con las respuestas esperadas del backend
