# seat-map-presentation Specification

## Purpose
Define cómo se presenta y recorre el mapa de seats y cómo se muestra la selección, para que elegir un seat sea claro en un teléfono, accesible sin depender del color y conduzca al siguiente paso.

## Requirements

### Requirement: Grilla alineada con orientación
El mapa SHALL disponer los seats en una grilla fija de 10 columnas, donde el número N de cada fila queda en la misma columna en todas las filas, incluidas las incompletas. SHALL mostrar un marcador "Stage" que indica el frente de la sala.

#### Scenario: Fila incompleta alineada
- **WHEN** un evento tiene 25 seats
- **THEN** los seats `C1` a `C5` quedan bajo `A1` a `A5` y `B1` a `B5`

#### Scenario: Orientación
- **WHEN** se muestra el mapa
- **THEN** se ve el marcador "Stage" antes de la fila `A`

### Requirement: Tamaño táctil en móvil
Cada seat seleccionable SHALL medir al menos 28 px de lado en cualquier ancho de pantalla desde 360 px (sobre el mínimo de 24 px de WCAG 2.2 AA) y las 10 columnas de una fila SHALL caber en el ancho disponible sin desplazamiento horizontal. Desde `sm` los seats miden 40 px.

#### Scenario: Pantalla de 390 px
- **WHEN** el mapa se muestra en una pantalla de 390 px de ancho
- **THEN** una fila de 10 seats se ve completa, cada seat mide al menos 28 px y la página no se desplaza en horizontal

#### Scenario: Pantalla de 360 px
- **WHEN** el mapa se muestra en una pantalla de 360 px
- **THEN** los 10 seats de la fila caben y cada uno mide al menos 28 px

### Requirement: Estados sin depender del color
Cada estado de seat SHALL distinguirse por una forma o símbolo además del color, igual en la leyenda y en el mapa: disponible, reservado, vendido, bloqueado y seleccionado. Los bordes o rellenos que identifican cada estado SHALL tener un contraste de al menos 3:1 con el fondo en ambos temas. El nombre accesible de cada seat SHALL seguir el formato "Seat A1, Available".

#### Scenario: Reservado frente a vendido
- **WHEN** se muestran un seat `RESERVED` y uno `SOLD` en escala de grises
- **THEN** se distinguen por su forma o símbolo

#### Scenario: Seleccionado en oscuro
- **WHEN** el usuario selecciona un seat en tema oscuro
- **THEN** el seat seleccionado se distingue de los disponibles por algo más que el color y con contraste de al menos 3:1

### Requirement: Recorrido con teclado
El mapa SHALL comportarse como una sola parada de Tab: al entrar, el foco va al seat seleccionado o al primer seat disponible, y las flechas mueven el foco entre seats (izquierda y derecha en la fila, arriba y abajo entre filas). Enter o Espacio SHALL seleccionar o quitar la selección. El foco SHALL ser visible con un contraste de al menos 3:1 en ambos temas.

#### Scenario: Pasar el mapa con Tab
- **WHEN** el usuario pulsa Tab desde el control anterior al mapa y luego Tab otra vez
- **THEN** el primer Tab entra al mapa y el segundo sale de él, sin recorrer cada seat

#### Scenario: Moverse con flechas
- **WHEN** el foco está en `A3` y el usuario pulsa la flecha abajo
- **THEN** el foco pasa a `B3`

### Requirement: Pase de selección
Mientras un USER tenga un seat seleccionado en un evento reservable, la UI SHALL mostrar el pase con el código del seat, el precio y el botón "Reserve" habilitado, con la nota "Held for 10 minutes once reserved". En móvil el pase SHALL ir fijo al borde inferior en una sola fila de no más de 120 px, y el evento y la regla visual de los 10 minutos SHALL estar en un detalle desplegable "Details". Desde `lg` el pase SHALL mostrar todo a la vez en una columna fija. Sin selección, el pase SHALL invitar a elegir un seat.

#### Scenario: Seat elegido
- **WHEN** el USER selecciona `C7` en un evento de $49.99 en una pantalla de 390 px
- **THEN** el pase muestra "C7", "$49.99" y "Reserve" habilitado en una sola fila, y mide no más de 120 px

#### Scenario: Detalle desplegable
- **WHEN** el USER pulsa "Details" en el pase móvil
- **THEN** aparecen el nombre y la fecha del evento y la regla de 10 tramos

#### Scenario: El pase no tapa el mapa
- **WHEN** el pase está fijo abajo en móvil
- **THEN** la última fila del mapa sigue siendo visible y pulsable al desplazar

#### Scenario: Escritorio
- **WHEN** hay un seat seleccionado en una pantalla ancha
- **THEN** el pase muestra a la vez el código, el precio, el evento, el botón, la regla y la nota

### Requirement: Recuperación cuando el seat se pierde
Cuando el seat seleccionado deja de estar disponible, la UI SHALL mostrar "<label> was just taken. Pick another seat" (por ejemplo "A3 was just taken. Pick another seat") y SHALL devolver el foco al mapa. Este texto reemplaza a "Your selected seat is no longer available" de `web-events`.

#### Scenario: Seat tomado por otro
- **WHEN** el usuario refresca y su seat `A3` ya está `RESERVED`
- **THEN** ve "A3 was just taken. Pick another seat" y el foco queda en el mapa

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
