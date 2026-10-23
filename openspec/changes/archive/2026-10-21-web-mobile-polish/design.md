## Context

Parte de `web-design-refresh` (completo) y de la crítica 28/40. Sistema documentado en `DESIGN.md`. La decisión de seats de 44 px con desplazamiento se revierte: 10 × 44 px = 440 px y el ancho útil en un teléfono es de 358 px.

## Decisions

### 1. Seats fluidos, sin desplazamiento
La fila es `grid-cols-[1.25rem_repeat(10,minmax(0,1fr))]` con `gap-0.5` en móvil, y cada seat es `aspect-square w-full`. En 390 px sale de unos 32 px; en 360 px, unos 29 px (sobre el mínimo de 24 px de WCAG 2.2). Desde `sm` vuelven a 40 px fijos (`sm:grid-cols-[1.75rem_repeat(10,2.5rem)]`). Se quitan el degradado, el contenedor con `overflow-x` y la letra pegajosa. El icono de estado baja a `size-2.5` en móvil.

### 2. Pase en dos formas, decidido por ancho
`SelectionPass` usa `useMediaQuery('(min-width: 1024px)')`: ancho muestra todo como hoy; estrecho muestra una fila (código, precio y Reserve) y una línea con la nota y un botón "Details" que abre el evento y la regla de 10 tramos. Sin selección es una sola línea. La perforación solo en ancho. En pruebas el ancho es de escritorio por defecto, así que las pruebas existentes no cambian.
- *Alternativa:* duplicar el DOM y ocultar con CSS. Se descarta por la misma razón que los filtros: duplica nombres accesibles.

### 3. Espacio inferior
El `pb-56` se reemplaza por `pb-28` (7 rem) solo en móvil con pase visible: el pase compacto mide unos 100 px más el área segura.

### 4. Leyenda arriba y "Jump to row"
La leyenda pasa entre el encabezado y la grilla. "Jump to row" es un `NativeSelect` visible si hay más de 8 filas; al elegir, `scrollIntoView` de la fila y foco en su primer seat seleccionable (`data-seat-label`).

### 5. Seats restantes en el encabezado
`seats` exporta `SeatsLeft` (hook `useEventSeats`, deduplicado por TanStack Query con el mapa). `EventDetailPage` lo pasa a `EventDetails` como `seatsLeft` solo con sesión; sin sesión se muestra el total. Así el módulo de eventos no depende de los hooks de seats.

### 6. Registro que vuelve al evento
`SignInToSeeSeats` enlaza a `/register?redirect=...` y `RegisterPage` pasa ese `redirect` al login (`loginPathWithRedirect`), que ya lo respeta.

### 7. Textos
"Coming soon" → "Reserving opens soon"; encabezado del mapa con la regla de los 10 minutos; error de seats dentro de un `Laminate`.

## Risks / Trade-offs

- [Seats más chicos] → cumplen WCAG 2.2 (24 px); la selección sigue siendo un solo toque y se probó con 358 px.
- [Muy poco espacio entre seats (2 px)] → la forma y el símbolo distinguen los estados; el foco se ve por el contorno de 2 px con separación.
