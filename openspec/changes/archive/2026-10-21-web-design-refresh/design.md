## Context

- **Punto de partida:** la crítica de Impeccable (`.impeccable/critique/2026-10-21T21-41-47Z__src-features-events.md`, 21/40) y la dirección elegida en la ronda de Impeccable, **All-Access Laminate** (seed `459174ee`, re-roll 1). La construcción es directa en código, sin imágenes de referencia: esta sesión no puede generarlas.
- **Contrato de dirección:** está en `.impeccable/surfaces/src-features-events.md` (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH) y no se copia al código fuente.
- **Base actual:** `index.css` ya define las variables de shadcn para `:root` y `.dark`, y la variante `dark:` de Tailwind usa la clase `.dark`. Pero nada activa esa clase, los colores de los seats están fijos para el modo claro y `sonner.tsx` fija `theme="light"`.

## Goals / Non-Goals

**Goals:**
- Un sistema visual propio y coherente en los dos temas, que se vea en el shell, el listado, el detalle y el mapa.
- Cerrar los problemas P0–P2 de la crítica sin cambiar el comportamiento de negocio ni las capas.

**Non-Goals:**
- Reservar de verdad: el botón "Reserve" queda deshabilitado.
- Rediseñar login y registro. Heredan las variables de diseño y los componentes base nuevos, pero no reciben una composición propia en esta ronda.
- Mostrar disponibilidad en las tarjetas, porque la API no la entrega.

## Decisions

### 1. Tema: store de Zustand, script antes del pintado y clase `.dark`
- **Store:** `src/shared/theme/theme.store.ts` con `preference: 'light' | 'dark' | 'system'`, guardado con `persist` en `localStorage` bajo la clave `ticket-theme`.
- **Aplicación:** `src/shared/theme/use-apply-theme.ts`, llamado desde `AppLayout`, resuelve el tema y aplica a `<html>` la clase `.dark` y `color-scheme`. Con `system` escucha `matchMedia('(prefers-color-scheme: dark)')`.
- **Sin parpadeo:** un script mínimo dentro de `index.html` lee la misma clave y aplica la clase antes del primer pintado.
- **Notificaciones:** `Toaster` recibe el tema resuelto.
- **Selector:** `ThemeMenu`, un menú desplegable de shadcn con tres opciones de radio y nombre accesible "Theme: System" (u otra opción). Va en el encabezado.
- *Alternativa:* next-themes. Se descarta: el usuario eligió Zustand para el estado del cliente, y el script inline se necesita igual.

### 2. Variables de diseño del mundo Laminate
`index.css` se reescribe:
- **Variables semánticas** para los dos temas: `--background`, `--foreground`, `--card` (laminado), `--muted`, `--border`, `--ring`, `--primary` (acción).
- **Variables propias:**
  - `--tier`: la franja de nivel, naranja fluorescente;
  - `--signal`: amarillo de señal;
  - `--gloss`: el borde de brillo del laminado;
  - los colores de cada estado de seat: `--seat-available-*`, `--seat-reserved-*`, `--seat-sold-*`, `--seat-blocked-*` y `--seat-selected-*`, cada uno con fondo, borde y texto.
- **Valores:** el tema oscuro (negro laminado) es la casa de la marca, y el claro es la tarjeta blanca con las mismas tintas, oscurecidas lo justo para AA. Cada par texto/fondo y borde/fondo se verifica en una prueba de contraste (tarea 2.3).
- **Limpieza:** se eliminan las variables `--chart-*` y `--sidebar-*`, que no se usan.
- *Alternativa:* clases fijas de Tailwind con variantes `dark:` en cada componente. Se descarta porque duplica la paleta en cada archivo y es justo lo que rompió el mapa.

### 3. Tipografía: una cara de bloque a tres tamaños
- **Display:** Archivo variable (`@fontsource-variable/archivo`, servida desde el proyecto), con el eje de ancho expandido y un peso de 800 a 900, en mayúsculas para códigos, fechas y precios. Tiene exactamente tres tamaños: `--text-code-sm`, `--text-code-md` y `--text-code-lg`.
- **Texto:** Geist sigue para el texto corrido y los controles.
- **Jerarquía:** se marca con peso, mayúsculas e inversión (tinta sobre laminado frente a laminado sobre tinta), no con más tamaños.

### 4. Componente `Laminate`
`src/shared/ui/laminate.tsx` es un panel con:
- franja de nivel opcional (`tier`);
- ranura de cordón perforada, decorativa (`aria-hidden`);
- borde de brillo;
- esquina de radio pequeño.

Se usa en la cabecera del evento, en las tarjetas del listado y en el pase de selección. No se anida uno dentro de otro.

### 5. Mapa: grilla fija con columnas por número
- **Grilla:** `grid-template-columns: <ancho de la letra> repeat(10, 2.75rem)`, y cada seat se ubica con `grid-column: number + 1`. Así las filas incompletas quedan alineadas.
- **Desplazamiento:** el contenedor tiene `overflow-x: auto` y la letra de la fila es `sticky left-0`.
- **Escenario:** una banda "Stage" encima de la fila `A`.
- **Tamaño:** 44 px en móvil y 40 px desde `sm`, donde ya hay puntero fino.

### 6. Estados con forma y símbolo
Tabla `SEAT_STATUS_STYLE` (se reescribe), con iconos de lucide en la esquina del seat. El número sigue legible al centro.

| Estado | Forma | Símbolo |
|---|---|---|
| Disponible | Contorno | — |
| Reservado | Rayado diagonal | `Clock` |
| Vendido | Relleno sólido | `X` |
| Bloqueado | Borde punteado | `Lock` |
| Seleccionado | Relleno de acción con doble borde | `Check` |

Los nombres accesibles no cambian. La leyenda usa los mismos estilos.

### 7. Teclado: un solo foco que se mueve con flechas
- **Paradas:** solo los seats seleccionables son botones. Un único botón tiene `tabIndex=0`: el seleccionado o, si no hay, el primer disponible. El resto tiene `-1`.
- **Movimiento:** las flechas mueven el foco al siguiente seat seleccionable en esa dirección y saltan los no disponibles. Enter y Espacio siguen siendo el clic del botón.
- **Lógica:** vive en `features/seats/seat-navigation.ts`, una función pura `nextSeat(seats, current, key)` que se prueba sola.
- Los seats no seleccionables siguen siendo `role="img"`, como esperan las pruebas existentes.

### 8. Pase de selección
`features/seats/components/SelectionPass.tsx` reemplaza a `SeatSelectionSummary`. Recibe el precio desde `EventDetailPage` a través de `SeatMap`.
- **Móvil:** fijo abajo (`fixed inset-x-0 bottom-0`), con el área segura del teléfono; la página agrega el relleno inferior equivalente para que la última fila siga visible.
- **Escritorio (`lg`):** columna derecha `sticky`.
- **Contenido:** código del seat en display `lg`, precio, una banda de la reserva que representa 10 minutos en escala (la reserva todavía no existe, así que se dibuja completa y quieta), y "Reserve" deshabilitado con el texto "Coming soon".
- **Seat perdido:** cuando se libera la selección, el texto pasa a "<label> was just taken. Pick another seat" y el foco va al seat con `tabIndex=0` del mapa.

### 9. Filtros en un panel en móvil
- **Detección del ancho:** `shared/lib/use-media-query.ts`. En las pruebas, `src/test/setup.ts` define `matchMedia` como escritorio por defecto, para que las pruebas actuales no cambien, y las pruebas de móvil lo sobreescriben.
- **Móvil:** `SearchField` visible más un botón "Filters (n)" que abre un `Sheet` de shadcn (Radix Dialog, con Escape y foco atrapado) con estado, tipo, fechas y "Clear filters".
- **Escritorio:** los filtros quedan en línea, como hoy.
- *Alternativa:* duplicar el DOM y ocultar con CSS. Se descarta porque duplica etiquetas y confunde a los lectores de pantalla y a las pruebas.

### 10. Tarjetas y eventos iniciados
- **Tarjeta:** `EventCard` pasa a ser un `Laminate` con un bloque de fecha a la izquierda (mes y día en display, la hora debajo), y nombre, tipo, lugar y precio a la derecha.
- **Iniciados y cancelados:** `getEventNotice` decide "Started" o "Cancelled", con opacidad reducida en el fondo y el texto todavía en AA.
- **Paginación:** solo se muestra cuando `totalPages > 1`.

### 11. Movimiento
- Los cambios de estado (seleccionar, quitar la selección, abrir el panel) usan `transition-timing-function: steps(2, end)` durante 90 ms, sin curvas suaves.
- Con `prefers-reduced-motion` no hay transición.
- El momento memorable, el sello del código en el pase al seleccionar, es una sola animación de dos pasos.

### 12. Proceso Impeccable
- Antes de editar la UI se lee `reference/craft-floor.md`.
- Al terminar:
  - capturas de escritorio (1440) y móvil (390) en los dos temas, en `.impeccable/review/`;
  - `impeccable detect --json` sobre los archivos cambiados;
  - revisión final con el agente `impeccable-finish-reviewer`;
  - documentación con `impeccable-documenter`, que escribe `DESIGN.md` y `.impeccable/design.json`.

## Risks / Trade-offs

- [Las connotaciones VIP del pase pueden prometer privilegios] → el texto nunca dice "VIP" ni "Access All Areas"; la franja de nivel es solo color, sin rótulo.
- [El rayado del estado reservado puede bajar el contraste del número] → el rayado va solo en el borde interno y el número conserva un fondo sólido; lo controla la prueba de contraste.
- [El script inline de tema y una CSP futura] → es corto y fijo; si se agrega CSP, se permite por hash. Queda anotado para `web-hardening`.
- [Archivo pesa más que una fuente de sistema] → se carga solo el rango latino y un subconjunto del eje; se mide con `pnpm build`.
- [Cambia el texto del seat perdido] → el cambio está aprobado al aprobar este spec, y la prueba de `web-events` se actualiza.
