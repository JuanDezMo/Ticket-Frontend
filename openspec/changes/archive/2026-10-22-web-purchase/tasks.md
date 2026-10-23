## 1. Preparación

- [x] 1.1 Agregar el `alert-dialog` de shadcn a `src/shared/ui` (corregir el import de `cn` a `@/shared/lib/utils` y quitar `"use client"`) y mover `Pagination` de `features/events/components` a `src/shared/ui/pagination.tsx`, con su prueba. Verificar con `pnpm test` y `pnpm arch`: las pruebas de eventos siguen pasando
- [x] 1.2 Agregar `ROUTES.checkoutPattern = '/checkout/:reservationId'` y `ROUTES.checkout(id)` a `src/shared/config/routes.ts`. Verificar con `pnpm typecheck`
- [x] 1.3 Agregar a `src/shared/api/error-messages.ts` el texto específico de `PAYMENT_GATEWAY_TIMEOUT` ("Payment service timed out. Please try again. You will not be charged twice") y comprobar que existen todos los códigos de pago y reserva. Verificar con la prueba de `error-messages`

## 2. Servidor simulado y fixtures

- [x] 2.1 Crear `src/test/fixtures/reservations.ts` (`makeReservation`, `makeTicket`) y agregar a `src/test/msw/` los handlers de reservas (`POST /reservations`, `GET /reservations/:id`, `POST /reservations/:id/cancel`), de compra (`POST /tickets/purchase`, donde el final de la tarjeta decide: `0000` → `402`, `9999` → `502`; el resto aprueba y responde `201`, y `200` en la repetición) y de `GET /tickets/me` paginado. Exponer `setReservations`, `setTickets` y `resetPurchaseData` y reiniciarlos en `setup.ts`. Verificar con `pnpm test`: las pruebas existentes siguen pasando

## 3. Feature `reservations`: datos y estado

- [x] 3.1 Crear `types.ts` (`RESERVATION_STATUSES` con los 5 estados y `Reservation`), `api.ts` (`create`, `getById`, `cancel`) y `query-keys.ts`. Verificar con `pnpm arch`: `api.ts` no importa React
- [x] 3.2 Crear `hold.store.ts` (`useHoldStore`, `persist` en `sessionStorage`, clave `ticket-hold`; `start`, `clear`) según la decisión 2. Verificar con pruebas: guarda solo los campos definidos, sobrevive a la rehidratación y `clear()` lo vacía
- [x] 3.3 Crear `hooks.ts`: `useReservation(id)` (decisión 3), `useReserveSeat()`, `useCancelReservation()` y `useHold()`, que descarta la reserva cuando la API la informa distinta de `ACTIVE`. Verificar con pruebas con MSW: una reserva `EXPIRED` limpia el store; `ACTIVE` lo conserva
- [x] 3.4 En `src/app/providers.tsx`, limpiar el store de la reserva al terminar la sesión. Verificar con una prueba: tras `signOut()` el store queda vacío

## 4. Feature `reservations`: cuenta regresiva y aviso

- [x] 4.1 Crear `use-countdown.ts` y `format-remaining.ts` (`mm:ss`) según la decisión 4. Verificar con pruebas con relojes falsos: "07:42", se actualiza cada segundo, se recupera tras una pausa de la pestaña y avisa una vez al llegar a cero
- [x] 4.2 Crear `components/HoldRuler.tsx` (10 tramos proporcionales a `createdAt`→`expiresAt`) y `components/Countdown.tsx` (texto `aria-hidden` más aviso `role="status"` en 5 min, 1 min y al vencer). Verificar con pruebas: 7:42 de 10:00 enciende 8 tramos; un TTL de 5 minutos escala la regla; el aviso se emite solo en los tres umbrales
- [x] 4.3 Crear `components/HoldBanner.tsx` y montarlo en `AppLayout` debajo del encabezado (solo USER con reserva activa y fuera de `/checkout/:id`). Exportar `HoldBanner`, `useHold`, `useReserveSeat` y `useCancelReservation` en `index.ts`. Verificar con pruebas: aparece en el listado con "Seat C7 is held" y el tiempo, no aparece en el checkout y desaparece al vencer la reserva

## 5. Reservar desde el pase

- [x] 5.1 Cambiar `SelectionPass` (formas ancha y compacta) para habilitar "Reserve" con "Reserving..." mientras envía, y mostrar "You are holding C7…" con el enlace cuando ya hay una reserva activa; quitar "Reserving opens soon" de la nota. Verificar con pruebas de los escenarios del spec modificado
- [x] 5.2 Integrar `useReserveSeat` en `SeatMap` (decisión 5) y exportar `seatKeys` desde `features/seats/index.ts`. Verificar con pruebas: reserva exitosa lleva a `/checkout/<id>` y deja el store con la reserva; `SEAT_NOT_AVAILABLE` muestra el mensaje, actualiza el mapa y quita la selección; `EVENT_NOT_ACTIVE`; la doble pulsación envía una sola solicitud; fallo de red conserva la selección

## 6. Feature `tickets`: checkout

- [x] 6.1 Crear `tickets/types.ts`, `api.ts` (`purchase`, `listMine`), `card.schemas.ts` y `format-card.ts`. Verificar con pruebas unitarias de los schemas: número de 10 dígitos, vencimiento pasado, CVV de 2 dígitos, franquicia vacía y espacios en el número (se quitan al enviar)
- [x] 6.2 Crear `purchase-errors.ts` (decisión 9) con la tabla `PURCHASE_ERROR_ACTIONS`. Verificar con una prueba que cubre cada código del spec y el caso de un código desconocido
- [x] 6.3 Crear `components/CardForm.tsx` (react-hook-form, atributos de autocompletado, "Pay <monto>", "Paying...", campos deshabilitados mientras paga, errores por campo, vaciado de número y CVV con foco al número en `402` y `422`). Verificar con pruebas: validación en el cliente, "Paying..." y una sola solicitud con doble pulsación, `402` y `422` vacían y enfocan, `502` y `504` conservan los datos, `VALIDATION_ERROR` muestra el error junto al campo
- [x] 6.4 Crear `CheckoutPage` con las vistas de la decisión 7 (`PayView`, `EndedView`, `NotFoundView`, `TicketIssuedView`), la cuenta regresiva y el pago bloqueado al llegar a cero, y registrar la ruta `/checkout/:reservationId` en `routes.tsx` con `RequireRole` USER. Verificar con pruebas de pantalla de cada fila de las tablas del spec (`ACTIVE`, `EXPIRED`, cancelada, `CONFIRMED`, `404`, `403`, id inválido sin llamar a la API, visitante → login con regreso)
- [x] 6.5 Pago exitoso: descartar la reserva en curso, actualizar `seatKeys.byEvent`, mostrar `TicketIssuedView` ("Ticket issued" con seat, evento, fecha y monto, y los enlaces). Verificar con pruebas: `201` y `200` muestran la misma confirmación, el aviso desaparece y el mapa del evento se actualiza
- [x] 6.6 Respuestas de reserva en el checkout: `RESERVATION_EXPIRED`, `EVENT_CANCELLED`, `RESERVATION_ALREADY_CANCELLED` y `404`/`403` reemplazan el formulario por su vista y limpian la reserva en curso. Verificar con una prueba por código

## 7. Cancelar la reserva

- [x] 7.1 Crear `components/CancelReservation.tsx` con el `alert-dialog`, deshabilitado mientras paga, y la lógica del spec (éxito: limpiar, actualizar el mapa, `toast` "Reservation cancelled" y volver al evento; `RESERVATION_ALREADY_CONFIRMED` lleva a "My tickets"). Verificar con pruebas: confirma y cancela, cierra el diálogo sin enviar, queda deshabilitado durante el pago y los dos errores `409`

## 8. Mis tickets

- [x] 8.1 Crear `hooks.ts` (`useMyTickets`), `components/TicketCard.tsx` (`Laminate` con seat en letra de bloque, evento, lugar, fecha, monto y fecha de emisión; "Cancelled by organizer" atenuado) y `pages/MyTicketsPage.tsx` con la página en la URL, los estados de carga, vacío ("You have no tickets yet", "Browse events") y error ("Try again"), y la paginación solo con más de una página. Reemplazar el placeholder de `src/app/pages.tsx`. Verificar con pruebas de pantalla de los escenarios del spec, incluido el acceso de un ADMIN

## 9. Seguridad, documentación y cierre

- [x] 9.1 Prueba de no persistencia: pagar con un error (`502`) y con un rechazo (`402`) y comprobar que no hay datos de la tarjeta en `localStorage`, `sessionStorage` ni en la caché de consultas (`queryClient.getQueryCache()` y `getMutationCache()`), y que una recarga deja el formulario vacío. Verificar que pasa con `pnpm test`
- [x] 9.2 Prueba de integración del flujo completo: iniciar sesión, elegir un seat, "Reserve", pagar con una tarjeta aprobada y ver el ticket en "My tickets"; y la variante con rechazo (`0000`) y reintento con otra tarjeta. Verificar con `pnpm test`
- [x] 9.3 Actualizar `DESIGN.md` y `.impeccable/design.json` (aviso de reserva, checkout, ticket) y `docs/api-integration.md` (pantallas ya implementadas, tarjetas de prueba de la pasarela). Verificar leyendo ambos
- [x] 9.4 Capturas de móvil (390) y escritorio (1440) en claro y oscuro del aviso, el checkout (activo y con error), el ticket emitido y "My tickets" en `.impeccable/review/`, y `impeccable detect`. Verificar que no hay recortes ni hallazgos de código
- [x] 9.5 Verificación manual contra `ticket-api` y la pasarela reales (`docker compose up -d --build`): reservar, recargar, ver el aviso, cancelar, reservar otra vez, pagar con una tarjeta que termina en `0000` (rechazo), en `9999` (error, tres veces hasta el `422`) y con `4111111111111111` (aprobada), dejar vencer una reserva y ver "My tickets". Verificar `pnpm check` y `pnpm build`
