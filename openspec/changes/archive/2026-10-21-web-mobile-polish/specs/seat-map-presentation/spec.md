## MODIFIED Requirements

### Requirement: Tamaño táctil en móvil
Cada seat seleccionable SHALL medir al menos 28 px de lado en cualquier ancho de pantalla desde 360 px (sobre el mínimo de 24 px de WCAG 2.2 AA) y las 10 columnas de una fila SHALL caber en el ancho disponible sin desplazamiento horizontal. Desde `sm` los seats miden 40 px.

#### Scenario: Pantalla de 390 px
- **WHEN** el mapa se muestra en una pantalla de 390 px de ancho
- **THEN** una fila de 10 seats se ve completa, cada seat mide al menos 28 px y la página no se desplaza en horizontal

#### Scenario: Pantalla de 360 px
- **WHEN** el mapa se muestra en una pantalla de 360 px
- **THEN** los 10 seats de la fila caben y cada uno mide al menos 28 px

### Requirement: Pase de selección
Mientras un USER tenga un seat seleccionado en un evento reservable, la UI SHALL mostrar el pase con el código del seat, el precio y el botón "Reserve" deshabilitado con la nota "Held for 10 minutes once reserved · Reserving opens soon". En móvil el pase SHALL ir fijo al borde inferior en una sola fila de no más de 120 px, y el evento y la regla visual de los 10 minutos SHALL estar en un detalle desplegable "Details". Desde `lg` el pase SHALL mostrar todo a la vez en una columna fija. Sin selección, el pase SHALL invitar a elegir un seat.

#### Scenario: Seat elegido
- **WHEN** el USER selecciona `C7` en un evento de $49.99 en una pantalla de 390 px
- **THEN** el pase muestra "C7", "$49.99" y "Reserve" deshabilitado en una sola fila, y mide no más de 120 px

#### Scenario: Detalle desplegable
- **WHEN** el USER pulsa "Details" en el pase móvil
- **THEN** aparecen el nombre y la fecha del evento y la regla de 10 tramos

#### Scenario: El pase no tapa el mapa
- **WHEN** el pase está fijo abajo en móvil
- **THEN** la última fila del mapa sigue siendo visible y pulsable al desplazar

#### Scenario: Escritorio
- **WHEN** hay un seat seleccionado en una pantalla ancha
- **THEN** el pase muestra a la vez el código, el precio, el evento, el botón, la regla y la nota

## ADDED Requirements

### Requirement: Leyenda junto al mapa
La leyenda de estados SHALL mostrarse encima de la grilla de seats y no debajo, para que siga a la vista mientras el usuario decide.

#### Scenario: Orden en pantalla
- **WHEN** se muestra el mapa
- **THEN** la leyenda aparece antes de la banda "Stage" y de la fila A

### Requirement: Saltar a una fila en eventos grandes
Cuando un evento tenga más de 8 filas, el mapa SHALL ofrecer un control "Jump to row" que lleve la vista y el foco a la primera fila elegible seleccionada.

#### Scenario: Evento de 26 filas
- **WHEN** un evento tiene 260 seats y el usuario elige la fila "M" en "Jump to row"
- **THEN** la fila `M` queda a la vista y el foco pasa a su primer seat disponible

#### Scenario: Evento chico
- **WHEN** un evento tiene 25 seats (3 filas)
- **THEN** no se muestra "Jump to row"

### Requirement: La reserva se explica antes de elegir
El encabezado del mapa SHALL decir, antes de elegir, que un seat reservado se retiene 10 minutos mientras se paga.

#### Scenario: Antes de elegir
- **WHEN** un USER abre el detalle de un evento reservable
- **THEN** el encabezado del mapa muestra "Pick a seat. Once reserved, it is held for 10 minutes while you pay."

### Requirement: Error de seats con diseño
Si la consulta de seats falla, el error SHALL mostrarse en una superficie propia con el mensaje y "Try again", sin ocultar los datos del evento.

#### Scenario: Falla la consulta de seats
- **WHEN** `GET /events/:id/seats` responde `500`
- **THEN** el detalle sigue mostrando el evento y el mapa muestra el mensaje y "Try again" dentro de una tarjeta
