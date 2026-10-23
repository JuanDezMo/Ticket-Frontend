## Why

La segunda crítica de Impeccable (28/40, sobre eventos y seats) dejó cinco problemas, dos de ellos P1, todos en móvil:
- el pase fijo tapa cerca del 27 % de la pantalla justo cuando el usuario decide;
- el mapa de 10 columnas de 44 px no cabe en 358 px y se corta en el seat 7;
- el visitante choca con un muro sin explicación;
- el encabezado del detalle es una ficha de datos;
- la reserva de 10 minutos se explica tarde.

## What Changes

- **Pase compacto en móvil:** una sola fila (código, precio y Reserve) de unos 100 px, con un detalle desplegable (evento y regla de los 10 minutos). Sin perforación en móvil. En escritorio no cambia.
- **Mapa que cabe en móvil:** seats fluidos de unos 30 a 34 px con las 10 columnas visibles en 360–390 px, sin desplazamiento lateral. Se quita el degradado del borde. La leyenda pasa encima del mapa y los eventos de más de 8 filas ofrecen "Jump to row". "Refresh" mide 44 px en móvil.
- **Texto del muro y de la reserva:**
  - el visitante lee por qué hay que iniciar sesión y puede elegir "Sign up", que lo devuelve al evento;
  - el encabezado del mapa explica la reserva de 10 minutos;
  - el pase dice "Reserving opens soon" en lugar de "Coming soon";
  - el error de seats tiene diseño propio.
- **Encabezado del detalle compacto:** el precio en letra de bloque y "Seats" en lugar de "Capacity": con sesión muestra cuántos seats quedan.

## Fuera de alcance

- Mostrar el mapa a visitantes sin sesión (requiere un cambio en `ticket-api`).
- Reservar de verdad y la cuenta regresiva (`web-purchase`).
- Zoom o vista general del mapa para eventos muy grandes, más allá de "Jump to row".

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `seat-map-presentation`: cambian el tamaño de los seats en móvil y el pase de selección, y se agregan la leyenda junto al mapa, "Jump to row" y la explicación de la reserva.
- `event-detail`: cambian el texto del muro del visitante y el encabezado.

## Impact

- **Código:** `src/features/seats/components/*`, `src/features/events/components/EventDetails.tsx`, `src/features/events/pages/EventDetailPage.tsx`, `src/features/auth/pages/RegisterPage.tsx` (conservar el destino al registrarse).
- **Enmienda de lo aprobado:** reemplaza el requisito de seats de al menos 44 × 44 px de `web-design-refresh`; la decisión fue del usuario tras la crítica, porque 10 × 44 px no caben en 358 px.
- Sin dependencias nuevas.
