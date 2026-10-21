## 1. Tema claro y oscuro (theme-preference)

- [ ] 1.1 Crear `src/shared/theme/theme.store.ts` (Zustand con `persist`, clave `ticket-theme`, `preference` en `light`, `dark` o `system`) y `resolve-theme.ts` (función pura que recibe la preferencia y el valor del sistema). Verificar con pruebas unitarias: valor por defecto `system`, persistencia en `localStorage` y resolución de las 3 × 2 combinaciones
- [ ] 1.2 Crear `use-apply-theme.ts`, que aplica `.dark` y `color-scheme` en `<html>` y escucha `matchMedia` cuando la preferencia es `system`, y llamarlo desde `AppLayout`. Agregar un `matchMedia` falso configurable en `src/test/setup.ts`. Verificar con pruebas: con el sistema en oscuro se aplica `.dark`, un cambio del sistema en vivo se aplica sin recargar y "Dark" fijado ignora al sistema
- [ ] 1.3 Agregar el script de tema dentro de `index.html`, que lee `ticket-theme` y aplica la clase antes del pintado. Verificar con una captura de Playwright con "Dark" guardado y el sistema en claro: el primer fotograma ya está en oscuro
- [ ] 1.4 Agregar el `dropdown-menu` de shadcn y crear `ThemeMenu` (radio Light, Dark o System, con nombre accesible "Theme: <opción>") en el encabezado. Conectar `Toaster` al tema resuelto y quitar `theme="light"`. Verificar con pruebas: elegir "Dark" cambia la clase y el nombre accesible, y el `Toaster` recibe `theme="dark"`

## 2. Variables de diseño y tipografía

- [ ] 2.1 Leer `reference/craft-floor.md` de Impeccable. Reescribir `:root` y `.dark` en `src/index.css` con las variables de la decisión 2 (semánticas, `--tier`, `--signal`, `--gloss` y las de cada estado de seat) y quitar `--chart-*` y `--sidebar-*`. Verificar con `pnpm build` y revisando que no queden referencias a las variables eliminadas
- [ ] 2.2 Instalar `@fontsource-variable/archivo` y definir `--font-display` y los tres tamaños `--text-code-*`. Verificar que `pnpm build` incluye la fuente desde el proyecto, sin hosts externos
- [ ] 2.3 Crear `src/shared/theme/contrast.test.ts`, que lee las variables de los dos temas y comprueba texto/fondo ≥ 4.5:1, bordes de seat y foco ≥ 3:1, y el número de cada seat ≥ 4.5:1. Verificar que pasa con `pnpm test`

## 3. Componentes base

- [ ] 3.1 Crear `src/shared/ui/laminate.tsx` (franja de nivel, ranura `aria-hidden` y borde de brillo) y adaptar `button`, `input`, `native-select`, `badge`, `card` y `field` al lenguaje Laminate, con foco ≥ 3:1. Verificar con `pnpm test`: las pruebas existentes siguen pasando
- [ ] 3.2 Rehacer el encabezado de `AppLayout` (marca de trabajo "Tickets" en display, navegación con áreas táctiles de al menos 44 px en móvil, email truncado y `ThemeMenu`). Verificar con las pruebas de `AppLayout` y una captura móvil de 390 px

## 4. Mapa de seats (seat-map-presentation)

- [ ] 4.1 Reescribir `seat-status-style.ts` con forma, símbolo y variables por estado (decisión 6) y actualizar `SeatLegend`. Verificar con pruebas: cada estado tiene un símbolo distinto y la leyenda lo muestra
- [ ] 4.2 Rehacer la grilla en `SeatMap` (10 columnas por número, letra de fila fija, banda "Stage", seats de 44 px en móvil y 40 px desde `sm`). Verificar con pruebas: `C1` comparte columna con `A1` en 25 seats y "Stage" está antes de la fila A; y con una captura de 390 px
- [ ] 4.3 Crear `seat-navigation.ts` (`nextSeat`) e integrar el foco móvil en `SeatMap`/`SeatTile`. Verificar con pruebas unitarias de `nextSeat` (flechas, bordes, saltar no disponibles) y una prueba de pantalla: un Tab entra al mapa, la flecha abajo va de A3 a B3 y otro Tab sale
- [ ] 4.4 Crear `SelectionPass` (decisión 8), reemplazar `SeatSelectionSummary` y pasar `price` desde `EventDetailPage`. Verificar con pruebas: muestra "C7" y "$49.99", "Reserve" está deshabilitado y, sin selección, invita a elegir un seat
- [ ] 4.5 Cambiar el texto del seat perdido a "<label> was just taken. Pick another seat" y devolver el foco al mapa. Actualizar la prueba de `web-events`. Verificar con una prueba que cubre el texto y el foco

## 5. Listado (event-list-presentation)

- [ ] 5.1 Crear `shared/lib/use-media-query.ts`, agregar el `sheet` de shadcn y separar los filtros en el panel "Filters (n)" en móvil, dejando la búsqueda visible. Verificar con pruebas en modo móvil: "Filters (2)" con dos filtros, elegir "Concert" en el panel filtra y Escape cierra; las pruebas de escritorio siguen pasando
- [ ] 5.2 Rehacer `EventCard` como `Laminate` con el bloque de fecha (decisión 10) y "Started" para los eventos iniciados, atenuados. Verificar con pruebas: "Nov 10" visible, un evento iniciado muestra "Started" y el enlace sigue apuntando al detalle
- [ ] 5.3 Mostrar la paginación solo si `totalPages > 1` y rehacer `EventDetails` como cabecera Laminate (franja de nivel, fecha en display y pares etiqueta/valor legibles en móvil). Verificar con pruebas: 5 eventos no muestran paginación, y las pruebas del detalle siguen pasando

## 6. Movimiento

- [ ] 6.1 Aplicar transiciones `steps(2)` de 90 ms a la selección, el sello del pase y el panel de filtros, desactivadas con `prefers-reduced-motion`. Verificar en el navegador y con una prueba que con movimiento reducido no hay `transition`

## 7. Revisión y cierre (Impeccable)

- [ ] 7.1 Capturar escritorio (1440) y móvil (390) en los dos temas para el listado, el detalle como visitante y el detalle con sesión, en `.impeccable/review/`, y correr `impeccable detect --json` sobre los archivos cambiados. Verificar que las capturas no tienen regiones en blanco y que los hallazgos del detector están corregidos o justificados
- [ ] 7.2 Revisión final con el agente `impeccable-finish-reviewer` y aplicar su veredicto (como máximo dos rondas). Verificar que el veredicto queda registrado
- [ ] 7.3 Documentar con `impeccable-documenter` y verificar que existen `DESIGN.md` y `.impeccable/design.json` con variables para los dos temas
- [ ] 7.4 Correr `pnpm check` y `pnpm build` completos. Volver a correr `/impeccable critique` de eventos y seats y comparar con el 21/40 anterior
