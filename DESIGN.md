---
name: Tickets (All-Access Laminate)
description: Pase plastificado de gira. Negro laminado en oscuro, tarjeta blanca en claro, banda de nivel naranja flúor y amarillo señal.
colors:
  primary: '#ff6b1a'
  tier: '#ffd400'
  light-background: '#f2f3f5'
  light-foreground: '#111317'
  light-card: '#fafbfc'
  light-popover: '#ffffff'
  light-secondary: '#f7f8fa'
  light-muted-foreground: '#4b5260'
  light-accent: '#eceef1'
  light-border: '#d7dbe1'
  light-input: '#737a88'
  light-ring: '#111317'
  light-destructive: '#c0352b'
  light-gloss: '#ffffff'
  light-primary-foreground: '#111317'
  dark-background: '#0b0c0f'
  dark-foreground: '#f3f2ee'
  dark-card: '#16181d'
  dark-popover: '#1e2128'
  dark-secondary: '#1e2128'
  dark-muted-foreground: '#a7adb8'
  dark-accent: '#262a32'
  dark-border: '#2c3039'
  dark-input: '#6f7686'
  dark-ring: '#ffd400'
  dark-destructive: '#ff6b5e'
  dark-primary-foreground: '#0b0c0f'
  seat-available-light-bg: '#ffffff'
  seat-available-light-border: '#5b6270'
  seat-available-light-fg: '#111317'
  seat-available-dark-bg: '#16181d'
  seat-available-dark-border: '#8b93a3'
  seat-available-dark-fg: '#f3f2ee'
  seat-reserved-light-bg: '#fff4b8'
  seat-reserved-light-border: '#8a6a00'
  seat-reserved-light-fg: '#5c4500'
  seat-reserved-dark-bg: '#1c1a10'
  seat-reserved-dark-border: '#ffd400'
  seat-reserved-dark-fg: '#ffd400'
  seat-sold-light-bg: '#d9dce1'
  seat-sold-light-border: '#5b6270'
  seat-sold-light-fg: '#2b2f36'
  seat-sold-dark-bg: '#2a2d35'
  seat-sold-dark-border: '#7d8494'
  seat-sold-dark-fg: '#c3c8d1'
  seat-blocked-light-bg: '#ffffff'
  seat-blocked-light-border: '#c0352b'
  seat-blocked-light-fg: '#a12a21'
  seat-blocked-dark-bg: '#0b0c0f'
  seat-blocked-dark-border: '#ff6b5e'
  seat-blocked-dark-fg: '#ff8f85'
  seat-selected-light-bg: '#ff6b1a'
  seat-selected-light-border: '#111317'
  seat-selected-light-fg: '#111317'
  seat-selected-dark-bg: '#ff6b1a'
  seat-selected-dark-border: '#ffd400'
  seat-selected-dark-fg: '#0b0c0f'
typography:
  code-lg:
    fontFamily: 'Archivo Variable, sans-serif'
    fontSize: '2.5rem'
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: '0.01em'
    fontFeature: 'font-stretch 125%; uppercase; tabular-nums'
  code-md:
    fontFamily: 'Archivo Variable, sans-serif'
    fontSize: '1.375rem'
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: '0.01em'
  code-sm:
    fontFamily: 'Archivo Variable, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: '0.01em'
  body:
    fontFamily: 'Geist Variable, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: 'Geist Variable, sans-serif'
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1.375
  headline:
    fontFamily: 'Geist Variable, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1.25
  label:
    fontFamily: 'Geist Variable, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.33
rounded:
  base: '6px'
  sm: '3.6px'
  md: '4.8px'
  lg: '6px'
  xl: '8.4px'
spacing:
  tap: '44px'
  tap-desktop: '36px'
  seat: '32px'
  seat-desktop: '40px'
  hold-segment-gap: '2px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.light-primary-foreground}'
    rounded: '{rounded.lg}'
    height: '44px'
    padding: '0 16px'
  button-outline:
    backgroundColor: '{colors.light-card}'
    textColor: '{colors.light-foreground}'
    rounded: '{rounded.lg}'
    height: '44px'
  laminate:
    backgroundColor: '{colors.light-card}'
    textColor: '{colors.light-foreground}'
    rounded: '{rounded.lg}'
  laminate-dark:
    backgroundColor: '{colors.dark-card}'
    textColor: '{colors.dark-foreground}'
    rounded: '{rounded.lg}'
  input:
    backgroundColor: '{colors.light-card}'
    textColor: '{colors.light-foreground}'
    rounded: '{rounded.lg}'
    height: '44px'
    padding: '4px 12px'
  badge:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.light-primary-foreground}'
    rounded: '{rounded.sm}'
    height: '20px'
    padding: '2px 8px'
  seat-tile:
    rounded: '{rounded.md}'
    size: '44px'
---

# Design System: Tickets (All-Access Laminate)

## Overview

**Creative North Star: "El pase de gira"**

Tu asiento se vuelve tu pase. El evento, la fila y la reserva se imprimen en un laminado que el comprador lleva durante todo el flujo. Es negro laminado en oscuro y tarjeta blanca en claro, con una banda de nivel naranja flúor y amarillo señal. Los códigos, fechas y precios van en mayúsculas anchas y pesadas en tres pasos fijos; el texto corrido lo pone una sans de trabajo. Cada panel lleva una ranura de cordón perforada y un borde de brillo fino. Los cambios de estado caen en dos pasos secos, sin suavizado.

La densidad es de móvil primero: objetivos táctiles de 44 px en botones y navegación, mapa de seats con las 10 columnas siempre visibles y un pase compacto acoplado al borde del pulgar. Los dos temas son de primera clase y ambos cumplen WCAG 2.2 AA (los pares los verifica `src/shared/theme/contrast.test.ts`). El tema por defecto sigue al sistema; el selector Light / Dark / System vive en el encabezado.

**Key Characteristics:**

- Un solo contenedor de marca (Laminate) y una sola voz de display (Archivo expandido, tres pasos).
- Naranja `primary` solo en lo pulsable o seleccionado; amarillo `tier` solo como banda de nivel, regla de reserva, subrayado activo y selección de texto.
- Estado de asiento = forma + símbolo + color; nunca solo color.
- Profundidad plana con un reflejo superior y una sombra suave; sin sombras duras.
- Movimiento en dos pasos de 90 ms, apagado con reduced motion.

## Colors

Neutros fríos con un naranja flúor y un amarillo señal. Los valores de ambos temas están en el frontmatter (prefijos `light-` y `dark-`); en el CSS son las variables de `:root` y `.dark` en `src/index.css`.

### Primary

- **Naranja flúor** (`primary`): botón por defecto, badge por defecto, asiento seleccionado, `accent-color` nativo. Idéntico en ambos temas. El texto sobre él es tinta casi negra (`light-primary-foreground` en claro, `dark-primary-foreground` en oscuro), nunca blanco.

### Secondary

- **Amarillo señal** (`tier`): banda de nivel de 8 px, segmentos de la regla de reserva, subrayado del enlace activo, fondo de `::selection`, y anillo de foco en oscuro (`dark-ring`). Igual en ambos temas.

### Neutral

- **Fondo / Tarjeta / Popover / Secundario / Acento**: escalera tonal de superficies (`*-background`, `*-card`, `*-popover`, `*-secondary`, `*-accent`). En claro va gris frío con tarjeta casi blanca; en oscuro va negro laminado con tarjetas un paso más claras.
- **Texto**: `*-foreground` y `*-muted-foreground` (secundario, AA sobre las superficies).
- **Bordes**: `*-border` (hairline decorativo) y `*-input` (borde de controles, más fuerte para cumplir contraste de componente de interfaz).
- **Destructivo**: `light-destructive` / `dark-destructive`; también marca el asiento bloqueado.

### Estados de asiento

Cinco conjuntos bg / border / fg por tema (`seat-<estado>-<tema>-*`): available, reserved, sold, blocked, selected. Ver Components.

### Named Rules

**The Two-Theme Rule.** Todo color nuevo se define como variable en `:root` y en `.dark`, se expone en `@theme inline` y entra al test de contraste. Un valor que existe en un solo tema es un defecto.

**The Pressable Accent Rule.** El naranja aparece solo en cosas pulsables o en la selección. Nunca decora títulos ni fondos.

**The Tier Rule.** El amarillo es una banda y una marca de regla, no un relleno de superficie ni de botón.

## Typography

**Display Font:** Archivo Variable (eje de ancho, con fallback sans-serif)
**Body Font:** Geist Variable (con fallback sans-serif)

**Character:** Archivo en `font-stretch: 125%`, peso 850, mayúsculas y cifras tabulares da bloques de código tipo credencial. Geist mantiene el resto sobrio y legible.

### Hierarchy

- **Código grande** (`code-lg`, 2.5rem, 850, 0.95): día de la fecha, código de asiento en el pase, título "Events".
- **Código medio** (`code-md`, 1.375rem, 850, 0.95): precio, títulos de sección ("Seats", "Filters").
- **Código chico** (`code-sm`, 0.8125rem, 850, 0.95): mes, letra de fila, marcador "Stage".
- **Headline** (Geist 600, 1.5rem): nombre del evento en el detalle.
- **Title** (Geist 600, 1rem): nombre en la tarjeta de evento.
- **Body** (Geist, 0.875rem): texto corrido, metadatos; 65 ch como máximo en descripciones.
- **Label** (Geist, 0.75rem): notas, hora, año, "Seat".

### Named Rules

**The Three Steps Rule.** Display tiene exactamente tres tamaños: `text-code-sm`, `text-code-md`, `text-code-lg`, siempre con la clase `.display`. No se añade un cuarto ni se usa Archivo fuera de ellos.

**The Code-Only Rule.** Display es para códigos, fechas, precios y títulos de sección. El texto de lectura nunca va en display.

## Layout

Contenedor `max-w-6xl` con `px-4`; encabezado sticky de 56 px (64 px desde `sm`). Objetivos táctiles de 44 px en móvil (36 px desde `sm`) para botones, inputs, enlaces de navegación. Tiles de asiento fluidos en móvil (unos 29 px a 360 px y 32 px a 390 px, sobre el mínimo de 24 px de WCAG 2.2; 40 px fijos desde `sm`) en una rejilla de 10 columnas con la columna calculada desde el número de asiento, de modo que las filas incompletas queden alineadas. El mapa no se desplaza en horizontal; la leyenda va encima de la rejilla y los eventos de más de 8 filas ofrecen "Jump to row". El pase de selección va fijo abajo en móvil, en una sola fila de unos 110 px (código, precio y Reserve, con "Details" para el evento y la regla de 10 tramos; respeta `safe-area-inset-bottom`), y en columna sticky de 20 rem desde `lg` con todo a la vista. La tarjeta de evento es una rejilla de dos columnas: bloque de fecha de 4.75 rem separado por borde discontinuo y datos a la derecha.

## Elevation & Depth

Capas tonales más un reflejo. No hay sombras duras. Un Laminate lleva `shadow-laminate`: brillo interior de 1 px (`gloss`), línea interior de 2 px (`border`) y una sombra suave desplazada hacia abajo (`laminate-shadow`). Encima, `.laminate-sheen` pinta una franja de luz a 172° que se apaga hacia el 38 %.

### Shadow Vocabulary

- **Laminate** (`inset 0 1px 0 var(--gloss), inset 0 2px 0 var(--border), var(--laminate-shadow)`): panel de pase. Claro: `0 10px 28px -18px rgb(17 19 23 / 0.45)`; oscuro: `0 14px 34px -18px rgb(0 0 0 / 0.9)`.
- **Sheen** (`linear-gradient(172deg, var(--sheen) 0%, transparent 38%)`): claro `rgb(255 255 255 / 0.95)`, oscuro `rgb(255 255 255 / 0.05)`.
- **Ranura perforada** (`inset 0 1px 2px var(--punch-rim)` más anillo de 1 px): claro `rgb(17 19 23 / 0.28)`, oscuro `rgb(0 0 0 / 0.7)`.
- **Anillo de selección** (`0 0 0 2px var(--seat-selected-bg)`, sin desenfoque ni desplazamiento): solo el asiento seleccionado.

### Named Rules

**The No-Nesting Rule.** Un Laminate nunca se anida dentro de otro; el reflejo y la sombra se duplicarían.

**The Cancelled-Flat Rule.** Las tarjetas con aviso (cancelado, iniciado) pierden la sombra y atenúan el texto sin bajar de AA.

## Shapes

Esquinas suaves y cortas: base `--radius` 0.375rem (6 px); `sm` 0.6x, `md` 0.8x, `lg` 1x, `xl` 1.4x. Laminate, botones e inputs usan `lg`; badges `sm`; tiles de asiento `md` con borde de 2 px. Las divisiones internas del pase usan borde discontinuo (`border-dashed`). La regla de reserva son 10 tramos de un minuto con extremos redondeados. La ranura del cordón es un círculo de 12 px (`size-3`) a la derecha, decorativa (`aria-hidden`).

## Components

### Laminate (componente firma)

Superficie `bg-card` con borde, `rounded-lg`, `overflow-hidden`, sheen y `shadow-laminate`. Props: `tier` (banda `tier` de 8 px arriba, sin borde superior; marca el pase principal: cabecera del evento y pase de selección) y `punched` (ranura de cordón en `top-5` con tier, `top-3` sin él). Usado por EventCard, EventDetails y SelectionPass.

### Buttons

- **Shape:** `rounded-lg`, 44 px de alto en móvil, 36 px desde `sm`, texto 14 px peso 600.
- **Default:** fondo `primary`, texto `primary-foreground`; hover mezcla 12 % de `foreground` en oklch.
- **Outline / Secondary / Ghost / Destructive / Link:** outline con borde `input` y fondo `card`; ghost con hover `accent`; destructive tintado al 10 % (20 % en oscuro).
- **Disabled:** fondo `muted`, texto `muted-foreground`, borde `border`. Reserve y Pay se deshabilitan mientras envían ("Reserving...", "Paying...") y mientras hay una reserva en curso.
- **Active:** baja 1 px. **Transición:** 90 ms `steps(2,end)`.

### Seat tile (gramática de estados)

Tile `aspect-square w-full` (`size-10` desde `sm`), `rounded-md`, borde de 2 px, número tabular. El estado se lee por forma + símbolo + color, y el nombre accesible incluye el texto ("Seat C7, Available"). Solo los asientos seleccionables son botones; el resto es `role="img"`.

- **Available:** borde sólido, fondo de superficie, sin símbolo.
- **Reserved:** fondo amarillo tenue, rayado diagonal a 135° (4 px / 9 px) y símbolo reloj en la esquina.
- **Sold:** relleno gris apagado, símbolo X.
- **Blocked:** borde discontinuo rojo, símbolo candado.
- **Selected:** relleno naranja, borde de tinta (claro) o amarillo (oscuro), anillo de 2 px y símbolo check.
  Los símbolos son de 12 px con trazo 3 en la esquina superior derecha. Un estado nuevo es una entrada más en `seat-status-style.ts` más sus variables en ambos temas, y entra a la leyenda automáticamente.

### Selection pass

Laminate `punched` con código de asiento en `code-lg`, precio en `code-md`, línea de evento, botón Reserve y la regla de reserva (10 tramos `tier` de 6 px, uno por minuto). Con una reserva en curso, Reserve queda deshabilitado y el pase dice "You are holding C7…" con el enlace al checkout. Al elegir un asiento el código se imprime con el sello: `stamp` 180 ms `steps(2,end)`, de escala 1.35 y opacidad 0.4 a normal.

### Inputs / Fields

Altura 44 px (36 desde `sm`), `rounded-lg`, borde `input`, fondo `card`, texto 16 px en móvil. Inválido: borde `destructive` y anillo de 3 px al 20 % (40 % en oscuro). El foco global es un contorno de 2 px `ring` con 2 px de separación.

### Badges

Altura 20 px, `rounded-sm`, texto 12 px peso 600. Default naranja; destructive es contorno rojo sin relleno; outline con borde `input`.

### Navigation

Encabezado sticky con fondo `background/90` y desenfoque. Logo en display. Enlaces de 44 px; el activo se marca con peso 600 y subrayado `tier` de 2 px (no solo color). Selector de tema Light / Dark / System en menú desplegable.

### Hold banner (aviso de reserva)

Laminate sin `tier` debajo del encabezado, en todas las páginas menos el checkout de esa reserva. Una fila (se parte en móvil): "Seat C7 is held", el tiempo restante en display `code-md` con la regla de 10 tramos debajo, "left" y el botón "Continue to checkout" a la derecha. La regla se consume en proporción a `createdAt`→`expiresAt` (tramos apagados en `border`, encendidos en `tier`). El texto "mm:ss" es `aria-hidden`; un `role="status"` aparte anuncia en 5 minutos, en 1 minuto y al vencer, nunca cada segundo.

### Checkout y tarjeta

Columna única de `max-w-md`. Arriba un Laminate `tier` + `punched` con el seat en `code-lg`, el monto en `code-md`, el evento y la cuenta regresiva; debajo el formulario de tarjeta (franquicia, número, vencimiento y CVV en la misma rejilla de campos de 44 px) y "Cancel reservation" como botón fantasma. El botón de pago dice "Pay $49.99" y pasa a "Paying..." con todos los campos deshabilitados. Los errores van junto al campo; los del pago, en un mensaje general sobre el botón. Los estados finales (vencida, cancelada, pagada, no encontrada) reemplazan todo por un `StatusMessage` con una sola acción.

### Ticket card y ticket emitido

El ticket reutiliza el lenguaje del pase: Laminate con el seat en `code-lg` (bloque de 5 rem separado por borde discontinuo en "My tickets"; `tier` + `punched` en la confirmación "Ticket issued"), el monto en `code-md` y el evento. En la lista todo el pase abre el evento (enlace extendido sobre el título). Un ticket de evento cancelado pierde la sombra, va sobre `muted` con el texto apagado (sin opacidad, para no bajar de AA) y lleva la etiqueta "Cancelled by organizer" (badge destructive).

### Admin: fila de evento y diálogo de cancelación

Cada evento del panel es un Laminate (sin `tier` ni anidar) en una fila: a la izquierda el nombre (enlace, con subrayado al pasar), la etiqueta de estado (outline "Active" o destructive "Cancelled"), la fecha con el lugar y el precio en `code-md` con la capacidad; a la derecha, en escritorio, la acción. En móvil la acción baja bajo los datos. "Cancel event" es el botón `destructive` y solo aparece en eventos activos que no han terminado. Pide confirmación con un `alert-dialog` (título "Cancel <nombre>?", qué se pierde y que no se deshace; "Keep event" a la izquierda y "Yes, cancel event" destructive); el resultado se comunica con un toast que cuenta reservas y tickets.

### Admin: formularios y vista previa de seats

Formularios de una columna de `max-w-2xl` (evento) o `max-w-md` (usuario) con los campos de 44 px; los pares de campos cortos (tipo y lugar, precio y capacidad, inicio y fin) pasan a dos columnas desde `sm`. La capacidad lleva una nota ("Seats are generated from this and cannot change later") y, mientras se escribe, la **vista previa de seats** dibuja la rejilla real: la misma de 10 columnas del mapa, con la letra de fila y tiles de seat disponibles, sin foco ni acción, y un resumen "25 seats in 3 rows" en peso 600. La rejilla es `aria-hidden`: el resumen de texto dice lo mismo. El rol de un usuario nuevo no tiene valor por defecto.

### Campo de fecha y hora

Botón outline con ícono de calendario y la fecha (o "Pick a date") junto a un campo de hora de 8 rem. El calendario se abre en un popover (`popover` sobre superficie `popover`, mes único): días de 44 px en móvil (36 desde `sm`), el día elegido en naranja `primary` con texto de tinta, el de hoy en negrita con subrayado, y los días fuera del mes atenuados. El campo entrega un `Date` local y los formularios lo envían en UTC.

### Motion

Todo estado cambia en dos pasos: `duration-[90ms] ease-[steps(2,end)]`. Se aplica a botones, tiles, hover de tarjeta y al sello. Con `prefers-reduced-motion` las transiciones se anulan (`motion-reduce:transition-none`) y el sello se quita (`motion-reduce:animate-none`).

## Do's and Don'ts

### Do:

- **Do** definir cada color nuevo en `:root` y en `.dark`, y cubrirlo en el test de contraste.
- **Do** usar `.display` solo con `text-code-sm`, `text-code-md` o `text-code-lg`.
- **Do** envolver pases y tarjetas de evento en `Laminate`; usar `tier` solo en el pase principal de la pantalla.
- **Do** expresar cada estado de asiento con forma, símbolo y color, y repetirlo en el nombre accesible.
- **Do** usar `duration-[90ms] ease-[steps(2,end)]` para cambios de estado y añadir `motion-reduce:` en cada transición o animación.
- **Do** mantener 44 px de objetivo táctil en botones y navegación; los seats son la excepción (unos 30 a 34 px) porque 10 × 44 px no caben en un teléfono.
- **Do** mostrar el tiempo restante de la reserva como texto `aria-hidden` y anunciarlo solo en 5 minutos, 1 minuto y al vencer.
- **Do** mostrar en una vista previa lo que una acción irreversible va a producir (por ejemplo, los seats de la capacidad) antes de enviarla.
- **Do** pedir confirmación que nombre el alcance antes de una acción destructiva (cancelar un evento) y decir después cuánto afectó.
- **Do** mostrar solo datos que la API entrega: la lista lleva capacidad; los asientos libres se leen en el detalle.

### Don't:

- **Don't** usar naranja para decorar; es para lo pulsable y la selección.
- **Don't** anidar un Laminate dentro de otro.
- **Don't** añadir un cuarto tamaño de display ni usar Archivo para texto de lectura.
- **Don't** diferenciar estados solo por color.
- **Don't** introducir transiciones suaves (`ease`, `ease-in-out`) en cambios de estado.
- **Don't** guardar ni mostrar de nuevo datos de tarjeta: viven solo en el formulario.
- **Don't** crear imágenes de evento ni datos inventados (organizadores, cifras) donde no existen.
