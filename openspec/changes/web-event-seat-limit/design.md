## Context

- **Backend ya cambiado:** `ticket-api` exige `maxSeatsPerUser` (entero de 1 a 8, no mayor que la capacidad, sin valor por defecto, inmutable) al crear un evento y lo devuelve en `POST /events`, `GET /events` y `GET /events/:id`. Sin este change el panel de admin **no puede crear eventos** (recibe `400`).
- **Frontend actual:** `features/admin` valida con `eventFormSchema` (campos numéricos como texto y conversión en `toCreateEventRequest`); la fila del panel es `AdminEventRow`; el detalle público es `EventDetails`; la tabla de errores vive en `shared/api`. Los datos de prueba salen de `makeEvent` y de los handlers de MSW.
- Reglas de arquitectura: `admin` importa de `events` solo por su `index.ts`; `events` no importa de `admin`.

## Goals / Non-Goals

**Goals:**
- Que crear un evento vuelva a funcionar y que el ADMIN fije el límite de forma explícita.
- Que quien compra vea el límite antes de elegir.

**Non-Goals:**
- Aplicar el límite en la selección y la reserva (`web-multi-seat-hold`).
- Editar el límite de un evento existente.

## Decisions

### 1. El límite como parte del tipo `Event` y una constante
`Event` gana `maxSeatsPerUser: number`. La constante `MAX_SEATS_PER_BUYER = 8` vive en `features/events/constants.ts` y se exporta por `index.ts`; la usan el esquema del formulario (admin) y, más adelante, la selección de seats. Se repite el rango de `ticket-api` (1 a 8) porque la UI valida antes de enviar; el servidor sigue siendo la autoridad.

### 2. Campo sin valor por defecto
"Max seats per buyer" es un campo de texto numérico (`inputMode="numeric"`) vacío al abrir, como la capacidad; no un selector con un valor preelegido, para que sea una decisión. Una nota ("It cannot be changed later") explica que es definitivo, igual que la capacidad.

### 3. Validación
En `eventFormSchema`: `maxSeatsPerUser` como texto con la regla "entero de 1 a 8", y una regla cruzada con la capacidad (mensaje "cannot exceed the capacity") en el mismo `superRefine` del esquema, solo cuando la capacidad ya es válida (si no, el error de capacidad basta). `toCreateEventRequest` lo convierte a número. Los mensajes: "Max seats per buyer is required", "Max seats per buyer must be a whole number from 1 to 8" y "Max seats per buyer cannot exceed the capacity".

### 4. Presentación
- **Panel:** la fila agrega "up to N per buyer" junto a "N seats", con el mismo estilo secundario.
- **Detalle:** `EventDetails` agrega un par "Limit" / "Up to N seats per buyer" a la lista de datos, **solo cuando N > 1** (con 1 no hay nada que explicar: es el comportamiento de siempre). Se muestra con o sin sesión, porque informa antes de iniciar sesión.

### 5. Código de error preparado
`SEAT_LIMIT_REACHED` se agrega a `ERROR_CODES` y a la tabla de mensajes con un texto genérico ("You have reached the seat limit for this event"). El mensaje con el número ("You can hold up to N seats for this event") lo arma `web-multi-seat-hold` donde conoce el evento; aquí solo se evita que el código llegue como error desconocido.

### 6. Datos de prueba
`makeEvent` incluye `maxSeatsPerUser` (4 por defecto, o la capacidad si es menor, para respetar la regla). El handler de `POST /events` de MSW rechaza con `400` un cuerpo sin el campo o fuera de rango, como la API real, y lo devuelve en la respuesta y en el listado.

## Risks / Trade-offs

- [Despliegue desacoplado] → sin este change, crear eventos falla contra el backend nuevo; y con este change contra un backend viejo, el campo extra se rechaza (esquema estricto). Backend y frontend se despliegan juntos.
- [El límite no se puede corregir] → la nota del formulario lo dice antes de enviar; no hay edición en la API.
- [Doble fuente del rango 1 a 8] → una constante en el frontend y otra en el backend; la prueba contra la API real (valores 0, 1, 8 y 9) detecta un desfase.
- [El texto "per buyer" puede confundirse con "por reserva"] → el detalle usa "Up to N seats per buyer" y el formulario, "Max seats per buyer", el mismo término en ambos lados.
