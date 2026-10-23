## MODIFIED Requirements

### Requirement: Panel de eventos
"/admin" SHALL mostrar, solo a un ADMIN, la lista paginada de todos los eventos (activos y cancelados) de `GET /events`, de a 12 y con la página en la URL (`page`). Cada evento SHALL mostrar su nombre, fecha de inicio, lugar, precio, capacidad, el máximo de seats por comprador y estado, y SHALL enlazar a su detalle. El panel SHALL ofrecer los accesos "Create event" y "Create user". La paginación SHALL ocultarse con una sola página.

#### Scenario: Lista de eventos
- **WHEN** un ADMIN abre "/admin" y hay un evento activo y uno cancelado
- **THEN** ve los dos con su estado ("Active" y "Cancelled"), fecha, lugar, precio, capacidad y el máximo de seats por comprador

#### Scenario: Máximo de seats por comprador
- **WHEN** el evento tiene `maxSeatsPerUser` 4 y capacidad 25
- **THEN** su fila muestra "25 seats" y "up to 4 per buyer"

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
"/admin/events/new" SHALL ser accesible solo a un ADMIN y pedir nombre, descripción, tipo (`CONCERT`, `MEETUP`, `MEETING` u `OTHER`), lugar, precio, capacidad, máximo de seats por comprador, inicio y fin. El máximo de seats por comprador ("Max seats per buyer") SHALL pedirse sin valor por defecto, para que el ADMIN lo decida, y SHALL avisar que no se puede cambiar después. El inicio y el fin SHALL elegirse con un calendario y una hora. La UI SHALL validar antes de enviar con las reglas de `ticket-api`: nombre, descripción y lugar obligatorios; precio mayor a 0; capacidad entera de 1 a 260; máximo de seats por comprador entero de 1 a 8 y no mayor que la capacidad; inicio posterior al momento actual; fin posterior al inicio. Los errores SHALL mostrarse junto a cada campo y el envío SHALL ser de una sola solicitud, con `maxSeatsPerUser`.

#### Scenario: Evento válido
- **WHEN** el ADMIN completa todos los campos con valores válidos y pulsa "Create event"
- **THEN** la UI envía una sola solicitud con `maxSeatsPerUser`, las fechas en UTC y el botón muestra "Creating..." mientras responde

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

#### Scenario: Sin valor por defecto
- **WHEN** el ADMIN abre el formulario
- **THEN** "Max seats per buyer" está vacío y avisa que no se puede cambiar después

#### Scenario: Máximo de seats obligatorio
- **WHEN** el ADMIN envía el formulario sin "Max seats per buyer"
- **THEN** la UI muestra "Max seats per buyer is required" junto al campo y no envía nada

#### Scenario: Máximo de seats en los límites
- **WHEN** el ADMIN escribe 1 y luego 8 (con una capacidad de al menos 8)
- **THEN** la UI acepta ambos valores y los envía como `maxSeatsPerUser`

#### Scenario: Máximo de seats fuera de rango
- **WHEN** el ADMIN escribe 0, 9, un decimal o un texto
- **THEN** la UI muestra "Max seats per buyer must be a whole number from 1 to 8" y no envía nada

#### Scenario: Máximo de seats mayor que la capacidad
- **WHEN** el ADMIN escribe una capacidad de 4 y un máximo de 5
- **THEN** la UI muestra "Max seats per buyer cannot exceed the capacity" junto al campo, y con un máximo de 4 lo acepta
