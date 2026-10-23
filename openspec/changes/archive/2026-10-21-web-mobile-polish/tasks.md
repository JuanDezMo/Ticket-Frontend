## 1. Pase compacto en móvil

- [x] 1.1 Reescribir `SelectionPass` con la forma ancha y la compacta (decisión 2), sin perforación en compacta y con "Details". Verificar con pruebas: en modo móvil muestra código, precio y Reserve en una fila, "Details" abre el evento y la regla; en ancho se ve todo
- [x] 1.2 Cambiar el espacio inferior del mapa (decisión 3) y la nota a "Reserving opens soon". Verificar con una captura de 390 px: el pase mide no más de 120 px y la última fila queda visible al desplazar

## 2. Mapa que cabe en móvil

- [x] 2.1 Seats fluidos y sin desplazamiento horizontal (decisión 1): `SeatTile`, `ROW_GRID` y `SeatMap`. Verificar con una captura de 390 px y otra de 360 px: la fila completa se ve y cada seat mide al menos 28 px
- [x] 2.2 Mover la leyenda encima de la grilla y subir "Refresh" a 44 px en móvil. Verificar con una prueba de orden en el DOM
- [x] 2.3 "Jump to row" para eventos de más de 8 filas (decisión 4). Verificar con pruebas: con 260 seats aparece y lleva el foco a la fila; con 25 no aparece

## 3. Texto del muro y de la reserva

- [x] 3.1 `SignInToSeeSeats` con la explicación, "Sign in" y "Sign up" con destino; `RegisterPage` conserva el `redirect` (decisión 6). Verificar con pruebas: el flujo visitante → "Sign up" → registro → login → vuelve al evento
- [x] 3.2 Frase de la reserva en el encabezado del mapa y error de seats dentro de un `Laminate`. Verificar con pruebas de los dos escenarios del spec

## 4. Encabezado del detalle

- [x] 4.1 Precio en letra de bloque y "Seats" con "N left" (decisión 5): `SeatsLeft`, `EventDetails` y `EventDetailPage`. Verificar con pruebas: con sesión muestra "23 left", sin sesión "25 seats"

## 5. Cierre

- [x] 5.1 Actualizar `DESIGN.md` y `design.json` (tamaño de seats y pase compacto) y las pruebas que dependían de los textos o tamaños anteriores. Verificar con `pnpm check` y `pnpm build`
- [x] 5.2 Capturas de móvil (390 y 360) en claro y oscuro con un seat elegido, y `impeccable detect`. Verificar que no hay recortes ni hallazgos del código
