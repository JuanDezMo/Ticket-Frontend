# event-detail Specification

## Purpose
Muestra la información completa de un evento y, a quien tiene sesión, el estado de cada seat, como paso previo a reservar.

## Requirements

### Requirement: Detalle del evento
La página "/events/:id" SHALL mostrar, a partir de `GET /events/:id` y sin exigir sesión, el nombre, la descripción, el tipo, el lugar, las fechas y horas de inicio y fin en la zona horaria del navegador, el precio, la capacidad y el estado del evento. SHALL ofrecer un enlace "Back to events" que vuelve al listado con los últimos filtros y la página que el usuario usó en esa pestaña, aunque haya iniciado sesión o recargado la página en el medio. Si no usó el listado en esa pestaña, vuelve a "/".

#### Scenario: Visitante abre un evento
- **WHEN** un visitante abre "/events/<id>" de un evento existente
- **THEN** ve todos los datos del evento

#### Scenario: Volver al listado
- **WHEN** el usuario llegó desde el listado filtrado y pulsa "Back to events"
- **THEN** vuelve al listado con los mismos filtros y página

#### Scenario: Volver después de iniciar sesión
- **WHEN** un visitante abre un evento desde el listado filtrado, inicia sesión desde el mapa de seats y pulsa "Back to events"
- **THEN** vuelve al listado con los mismos filtros y página

#### Scenario: Volver después de recargar
- **WHEN** el usuario recarga el detalle y pulsa "Back to events"
- **THEN** vuelve al listado con los mismos filtros y página

#### Scenario: Sin listado previo
- **WHEN** el usuario abre el detalle directo, sin haber usado el listado en esa pestaña, y pulsa "Back to events"
- **THEN** vuelve a "/"

#### Scenario: Recargar el detalle
- **WHEN** el usuario recarga "/events/<id>"
- **THEN** la página se muestra igual, sin depender de haber pasado por el listado

### Requirement: Evento inexistente o inválido
Si la API responde `404 EVENT_NOT_FOUND` o el id de la URL no es válido, la página SHALL mostrar "Event not found" con un enlace al listado.

#### Scenario: Evento inexistente
- **WHEN** la API responde `404` con `EVENT_NOT_FOUND`
- **THEN** la UI muestra "Event not found" y un enlace "Back to events"

#### Scenario: Id inválido
- **WHEN** el usuario abre "/events/abc"
- **THEN** la UI muestra "Event not found" sin llamar a la API

### Requirement: Avisos de disponibilidad
El detalle SHALL avisar cuando el evento no admite reservas:
- si está `CANCELLED`: "This event has been cancelled";
- si su inicio ya pasó: "This event has already started".

#### Scenario: Evento cancelado
- **WHEN** el evento tiene `status` `CANCELLED`
- **THEN** el detalle muestra "This event has been cancelled"

#### Scenario: Evento ya iniciado
- **WHEN** el `startDate` del evento es anterior al momento actual
- **THEN** el detalle muestra "This event has already started"

### Requirement: Mapa de seats
Con sesión, el detalle SHALL mostrar los seats de `GET /events/:id/seats` agrupados en filas (`A`, `B`, ...) de hasta 10 puestos, en el orden de la API. Cada seat SHALL mostrar su etiqueta y distinguirse por estado:

| Estado | Texto en la leyenda |
|---|---|
| `AVAILABLE` | "Available" |
| `RESERVED` | "Reserved" |
| `SOLD` | "Sold" |
| `BLOCKED` | "Blocked" |

El estado SHALL reconocerse por algo más que el color, con un nombre accesible como "Seat A1, Available". El mapa SHALL mostrar la leyenda, el total "X of Y seats available" y un botón "Refresh" que vuelve a consultar los seats.

#### Scenario: Usuario con sesión ve el mapa
- **WHEN** un usuario con sesión abre el detalle de un evento de 25 seats
- **THEN** ve las filas `A` y `B` con 10 seats y la fila `C` con 5

#### Scenario: Estados distinguibles
- **WHEN** un seat está `SOLD`
- **THEN** se muestra con el estilo de "Sold" y su nombre accesible incluye "Sold"

#### Scenario: Total disponible
- **WHEN** 18 de 20 seats están `AVAILABLE`
- **THEN** el mapa muestra "18 of 20 seats available"

#### Scenario: Refrescar
- **WHEN** el usuario pulsa "Refresh"
- **THEN** la UI vuelve a consultar los seats y muestra los estados actualizados

### Requirement: Mapa de seats solo con sesión
Sin sesión, el detalle MUST NOT consultar los seats y SHALL mostrar "Sign in to see available seats" con una explicación de por qué se pide la cuenta (los seats se muestran a compradores con sesión, y crear la cuenta es gratis) y dos acciones: "Sign in" y "Sign up". Ambas SHALL volver a este evento al terminar.

#### Scenario: Visitante en el detalle
- **WHEN** un visitante abre el detalle de un evento
- **THEN** ve "Sign in to see available seats", la explicación, "Sign in" y "Sign up", y no se hace ninguna solicitud de seats

#### Scenario: Iniciar sesión desde el detalle
- **WHEN** el visitante pulsa "Sign in" e inicia sesión
- **THEN** vuelve a "/events/<id>" y ve el mapa de seats

#### Scenario: Registrarse desde el detalle
- **WHEN** el visitante pulsa "Sign up", crea la cuenta e inicia sesión
- **THEN** vuelve a "/events/<id>" y ve el mapa de seats

### Requirement: Errores del mapa de seats
Si la consulta de seats falla, el mapa SHALL mostrar el mensaje del error y "Try again", sin ocultar los datos del evento.

#### Scenario: Falla la consulta de seats
- **WHEN** `GET /events/:id/seats` responde `500`
- **THEN** el detalle sigue mostrando el evento y el mapa muestra el mensaje genérico y "Try again"

### Requirement: Selección de seats
Un usuario con rol `USER` SHALL poder seleccionar seats `AVAILABLE` en el mapa de un evento que no está cancelado ni iniciado, hasta el cupo que le deja el límite del evento (ver `seat-reservation`). El detalle SHALL mostrar "Selected seat: <label>" con un seat, o "Selected seats: <labels>" con varios. Pulsar de nuevo un seat elegido lo deselecciona. Con un máximo de 1 seat por comprador, pulsar otro seat reemplaza la selección. Los seats en otro estado, el rol `ADMIN` y los eventos con aviso de disponibilidad MUST NOT permitir seleccionar. La selección SHALL conservarse al navegar dentro de la aplicación y SHALL borrarse al cerrar o vencer la sesión. Si algún seat seleccionado deja de estar `AVAILABLE` al refrescar el mapa, la selección de ese seat SHALL quitarse y la UI SHALL avisarlo como describe `seat-map-presentation`.

#### Scenario: Seleccionar un seat disponible
- **WHEN** un USER pulsa el seat `C7` disponible
- **THEN** el seat se muestra seleccionado y aparece "Selected seat: C7"

#### Scenario: Seleccionar varios seats
- **WHEN** un USER en un evento que permite 4 seats pulsa `C7` y `C8`
- **THEN** los dos se muestran seleccionados y aparece "Selected seats: C7, C8"

#### Scenario: Deseleccionar y reemplazar
- **WHEN** el USER pulsa otra vez `C7`, o, en un evento de 1 seat por comprador, pulsa `D2`
- **THEN** la selección se quita, o pasa a `D2`

#### Scenario: Seat no disponible
- **WHEN** el USER pulsa un seat `SOLD`, `RESERVED` o `BLOCKED`
- **THEN** no se selecciona nada

#### Scenario: ADMIN o evento no reservable
- **WHEN** un ADMIN ve el mapa, o el evento está cancelado o ya inició
- **THEN** ningún seat se puede seleccionar

#### Scenario: Volver al evento
- **WHEN** el USER selecciona `C7` y `C8`, vuelve al listado y abre otra vez el mismo evento
- **THEN** `C7` y `C8` siguen seleccionados

#### Scenario: El seat deja de estar disponible
- **WHEN** el USER pulsa "Refresh" y el seat seleccionado ya está `RESERVED`
- **THEN** se quita ese seat de la selección y aparece "<label> was just taken. Pick another seat"

#### Scenario: Cierre de sesión
- **WHEN** el USER cierra sesión con seats seleccionados
- **THEN** la selección se borra

### Requirement: Datos del evento centrados en quien compra
El encabezado del detalle SHALL mostrar el precio en letra de bloque y, en lugar de la capacidad, la cantidad de seats: con sesión "N left" (los disponibles según el mapa); sin sesión, el total de seats del evento. Cuando el evento permite más de un seat por comprador, el encabezado SHALL indicar "Up to N seats per buyer"; con un máximo de 1 no muestra esa indicación.

#### Scenario: Con sesión
- **WHEN** un usuario con sesión abre un evento de 25 seats con 23 disponibles
- **THEN** el encabezado muestra "23 left" junto a "Seats"

#### Scenario: Sin sesión
- **WHEN** un visitante abre ese evento
- **THEN** el encabezado muestra "25 seats"

#### Scenario: Máximo por comprador
- **WHEN** el evento permite 4 seats por comprador, con o sin sesión
- **THEN** el encabezado muestra "Up to 4 seats per buyer"

#### Scenario: Máximo de 8
- **WHEN** el evento permite 8 seats por comprador
- **THEN** el encabezado muestra "Up to 8 seats per buyer"

#### Scenario: Máximo de 1
- **WHEN** el evento permite 1 seat por comprador
- **THEN** el encabezado no muestra ninguna indicación del máximo
