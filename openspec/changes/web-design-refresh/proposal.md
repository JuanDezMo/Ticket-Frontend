## Why

La UI de `web-events` funciona, pero se ve como el kit inicial de shadcn y no dice nada del producto. La crítica de Impeccable del 2026-10-21 le dio 21/40 y encontró:

- **P0:** el modo claro y oscuro no existe aunque `PRODUCT.md` lo exige.
- **P1:**
  - seats de 26 px y columnas desalineadas en móvil;
  - una selección de seat que termina en un texto, sin precio ni acción;
  - estados de seat que dependen solo del color.
- **P2:** en móvil el listado empieza por los filtros y las tarjetas no tienen jerarquía.

Hay que resolverlo antes de `web-purchase`, porque esa iteración se apoya en el mapa y en la selección.

## What Changes

- **Temas claro y oscuro:**
  - por defecto sigue el sistema operativo;
  - selector Light / Dark / System en el encabezado, que se recuerda;
  - el tema se aplica antes de pintar la página, sin parpadeo;
  - las notificaciones siguen el tema activo;
  - contraste AA en los dos temas.
- **Nueva identidad visual "All-Access Laminate"**, elegida en la ronda de dirección de Impeccable. Dirección completa en `.impeccable/surfaces/src-features-events.md`.
  - El evento y el seat elegido se presentan como un pase plastificado de gira.
  - Una tipografía de bloque, ancha y pesada, para códigos, fechas y precios, en tres tamaños fijos.
  - Una franja de color por nivel, y el acento solo en lo que se puede pulsar.
  - Cambios de estado secos, en dos pasos.
- **Mapa de seats:**
  - grilla fija de 10 columnas alineadas, con un marcador del escenario;
  - seats de al menos 44 px en móvil, con desplazamiento horizontal y la letra de la fila fija si no caben;
  - cada estado se distingue también por forma o símbolo;
  - navegación con flechas dentro del mapa;
  - foco visible con contraste de al menos 3:1.
- **Pase de selección fijo abajo:** código del seat, precio y un botón "Reserve" deshabilitado, con la duración de la reserva. Cuando el seat se pierde, un mensaje que dice qué hacer y devuelve el foco al mapa.
- **Listado:**
  - en móvil la búsqueda queda visible y el resto de los filtros pasa a un panel "Filters (n)";
  - tarjetas encabezadas por la fecha;
  - tratamiento visual para los eventos ya iniciados y cancelados;
  - la paginación se oculta cuando hay una sola página.
- Al final, `DESIGN.md` y `.impeccable/design.json` documentan el sistema construido.

## Fuera de alcance

- **Cambios de comportamiento de negocio:** el visitante sigue necesitando sesión para ver los seats, y "Reserve" no reserva todavía; eso llega en `web-purchase`.
- **Cambios en `ticket-api`:** las tarjetas no muestran "seats left" porque `GET /events` no lo devuelve. Queda anotado como hueco del backend.
- **Imágenes de eventos y logos de organizadores:** la API no los tiene.
- **Las pantallas de admin y "Mis tickets":** siguen siendo placeholders y heredan el sistema cuando se construyan.
- **El nombre definitivo de la plataforma.**

## Capabilities

### New Capabilities

- `theme-preference`: elección y aplicación del tema claro u oscuro, con el valor por defecto del sistema y la elección recordada.
- `seat-map-presentation`: cómo se muestran y recorren los seats (estados sin depender del color, tamaño, alineación, teclado) y el pase de selección.
- `event-list-presentation`: filtros plegables en móvil, jerarquía de las tarjetas, estado de los eventos iniciados y paginación.

### Modified Capabilities

Ninguna. Los specs de `web-foundation` y `web-events` todavía no están archivados. Los requisitos nuevos los complementan sin cambiar su comportamiento; la única excepción es el texto del mensaje de seat perdido, que se detalla en `seat-map-presentation`.

## Impact

- **Código:**
  - `src/index.css` (variables de diseño de los dos temas) e `index.html` (script de tema);
  - `src/shared/ui/*` (componentes rehechos en el lenguaje nuevo);
  - `src/shared/theme/` (nuevo: store de Zustand y selector);
  - `src/app/AppLayout.tsx`;
  - `src/features/events/components/*` y `src/features/seats/components/*`.
- **Dependencias:** `@fontsource-variable/archivo`, la fuente de bloque con eje de ancho, servida desde el proyecto.
- **Pruebas:** las existentes deben seguir pasando. Se agregan pruebas de tema, de navegación con teclado del mapa y del pase de selección.
- **Impeccable:** surface brief en `.impeccable/surfaces/`; al final, `DESIGN.md` y `.impeccable/design.json`.
