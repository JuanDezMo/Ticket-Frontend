# admin-events Specification

## Purpose
Permite a un administrador ver todos los eventos, publicar uno nuevo sabiendo cuántos seats se generarán y cancelarlo con conocimiento de sus consecuencias.

## Requirements

### Requirement: Panel de eventos
"/admin" SHALL mostrar, solo a un ADMIN, la lista paginada de todos los eventos (activos y cancelados) de `GET /events`, de a 12 y con la página en la URL (`page`). Cada evento SHALL mostrar su nombre, fecha de inicio, lugar, precio, capacidad y estado, y SHALL enlazar a su detalle. El panel SHALL ofrecer los accesos "Create event" y "Create user". La paginación SHALL ocultarse con una sola página.

#### Scenario: Lista de eventos
- **WHEN** un ADMIN abre "/admin" y hay un evento activo y uno cancelado
- **THEN** ve los dos con su estado ("Active" y "Cancelled"), fecha, lugar, precio y capacidad

#### Scenario: Paginación
- **WHEN** hay 30 eventos y el ADMIN pulsa "Next" en la página 1
- **THEN** la URL cambia a `page=2` y se muestran los eventos de esa página

#### Scenario: Sin eventos
- **WHEN** la API responde `data` vacío
- **THEN** la UI muestra "No events yet" y el acceso "Create event"

#### Scenario: Error de carga
- **WHEN** la consulta falla y el ADMIN pulsa "Try again"
- **THEN** la UI repite la consulta

#### Scenario: Acceso
- **WHEN** un USER abre "/admin"
- **THEN** la UI muestra la página de sin permiso

### Requirement: Formulario de evento
"/admin/events/new" SHALL ser accesible solo a un ADMIN y pedir nombre, descripción, tipo (`CONCERT`, `MEETUP`, `MEETING` u `OTHER`), lugar, precio, capacidad, inicio y fin. El inicio y el fin SHALL elegirse con un calendario y una hora. La UI SHALL validar antes de enviar con las reglas de `ticket-api`: nombre, descripción y lugar obligatorios; precio mayor a 0; capacidad entera de 1 a 260; inicio posterior al momento actual; fin posterior al inicio. Los errores SHALL mostrarse junto a cada campo y el envío SHALL ser de una sola solicitud.

#### Scenario: Evento válido
- **WHEN** el ADMIN completa todos los campos con valores válidos y pulsa "Create event"
- **THEN** la UI envía una sola solicitud con las fechas en UTC y el botón muestra "Creating..." mientras responde

#### Scenario: Datos inválidos en el cliente
- **WHEN** el ADMIN envía un precio de 0, una capacidad de 300 o un fin anterior al inicio
- **THEN** la UI muestra el error junto al campo y no envía nada

#### Scenario: Inicio en el pasado
- **WHEN** el ADMIN elige un inicio anterior al momento actual
- **THEN** la UI muestra "Start must be in the future" junto al campo

#### Scenario: Error del servidor
- **WHEN** la API responde `400 VALIDATION_ERROR`
- **THEN** la UI muestra el mensaje en el formulario y conserva todo lo escrito

#### Scenario: Doble pulsación
- **WHEN** el ADMIN pulsa "Create event" dos veces seguidas
- **THEN** se envía una sola solicitud

#### Scenario: Acceso
- **WHEN** un USER o un visitante abre "/admin/events/new"
- **THEN** el USER ve la página de sin permiso y el visitante va al login

### Requirement: Vista previa de seats
Mientras el ADMIN escribe la capacidad, el formulario SHALL mostrar una vista previa de los seats que se generarán: filas con letras desde `A`, de a 10 seats, con la última fila incompleta si la capacidad no es múltiplo de 10, y un resumen "<N> seats in <R> rows". La vista previa SHALL calcularse en el cliente, sin llamar a la API, y SHALL ocultarse mientras la capacidad no sea un entero de 1 a 260.

#### Scenario: Capacidad de 25
- **WHEN** el ADMIN escribe una capacidad de 25
- **THEN** la vista previa muestra "25 seats in 3 rows" con las filas A y B de 10 seats y la fila C de 5

#### Scenario: Capacidad inválida
- **WHEN** el ADMIN escribe 0, 300 o un valor que no es un número
- **THEN** la vista previa no se muestra

#### Scenario: Capacidad máxima
- **WHEN** el ADMIN escribe 260
- **THEN** la vista previa muestra "260 seats in 26 rows", de la fila A a la Z

#### Scenario: No es interactiva
- **WHEN** el ADMIN navega la vista previa con el teclado
- **THEN** los seats no son enfocables ni seleccionables

### Requirement: Evento creado
Con una respuesta `201`, la UI SHALL actualizar la lista de eventos, mostrar "Event created" y llevar al detalle del evento nuevo.

#### Scenario: Creación exitosa
- **WHEN** la API responde `201` con el evento
- **THEN** la UI abre "/events/<id del evento>", muestra "Event created" y el evento aparece en el panel

### Requirement: Cancelar un evento
El panel SHALL ofrecer "Cancel event" en cada evento `ACTIVE` cuya fecha de fin no haya pasado. Al pulsarlo, la UI SHALL pedir confirmación indicando que se cancelarán las reservas y los tickets del evento y que no se puede deshacer. Con la confirmación SHALL enviar una sola solicitud y, mientras responde, deshabilitar el botón. Con una respuesta exitosa SHALL actualizar la lista, el detalle y el mapa de seats del evento y mostrar cuántas reservas y tickets se cancelaron.

#### Scenario: Cancelación confirmada
- **WHEN** el ADMIN pulsa "Cancel event" en "Rock Night" y confirma, y la API responde `cancelledReservations` 4 y `cancelledTickets` 12
- **THEN** el evento figura "Cancelled" en el panel y la UI muestra "Event cancelled: 4 reservations and 12 tickets cancelled"

#### Scenario: No confirma
- **WHEN** el ADMIN pulsa "Cancel event" y cierra el diálogo
- **THEN** no se envía ninguna solicitud y el evento sigue activo

#### Scenario: Eventos que no se pueden cancelar
- **WHEN** un evento ya está cancelado o ya terminó
- **THEN** el panel no ofrece "Cancel event" para ese evento

#### Scenario: Ya estaba cancelado
- **WHEN** la API responde `409 EVENT_ALREADY_CANCELLED`
- **THEN** la UI muestra "This event is already cancelled" y actualiza la lista

#### Scenario: Ya terminó
- **WHEN** la API responde `409 EVENT_ALREADY_ENDED`
- **THEN** la UI muestra "This event has already ended" y actualiza la lista

#### Scenario: Doble pulsación
- **WHEN** el ADMIN confirma dos veces seguidas
- **THEN** se envía una sola solicitud
