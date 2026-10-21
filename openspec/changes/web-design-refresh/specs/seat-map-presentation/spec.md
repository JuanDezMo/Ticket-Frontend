## Purpose

Define cómo se presenta y recorre el mapa de seats y cómo se muestra la selección, para que elegir un seat sea claro en un teléfono, accesible sin depender del color y conduzca al siguiente paso.

## ADDED Requirements

### Requirement: Grilla alineada con orientación
El mapa SHALL disponer los seats en una grilla fija de 10 columnas, donde el número N de cada fila queda en la misma columna en todas las filas, incluidas las incompletas. SHALL mostrar un marcador "Stage" que indica el frente de la sala.

#### Scenario: Fila incompleta alineada
- **WHEN** un evento tiene 25 seats
- **THEN** los seats `C1` a `C5` quedan bajo `A1` a `A5` y `B1` a `B5`

#### Scenario: Orientación
- **WHEN** se muestra el mapa
- **THEN** se ve el marcador "Stage" antes de la fila `A`

### Requirement: Tamaño táctil en móvil
Cada seat seleccionable SHALL tener un área táctil de al menos 44 × 44 px. Si las 10 columnas no caben en el ancho disponible, el mapa SHALL desplazarse en horizontal manteniendo visible la letra de cada fila.

#### Scenario: Pantalla de 390 px
- **WHEN** el mapa se muestra en una pantalla de 390 px de ancho
- **THEN** cada seat mide al menos 44 × 44 px y la letra de la fila sigue visible al desplazar

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
Mientras un USER tenga un seat seleccionado en un evento reservable, la UI SHALL mostrar un pase fijo al borde inferior en móvil, y junto al mapa en escritorio, con el código del seat, el precio del evento y un botón "Reserve" con la nota "Held for 10 minutes once reserved". Hasta que exista la reserva (`web-purchase`), el botón SHALL estar deshabilitado y explicar que llega pronto. Sin selección, el pase SHALL invitar a elegir un seat.

#### Scenario: Seat elegido
- **WHEN** el USER selecciona `C7` en un evento de $49.99
- **THEN** el pase muestra "C7", "$49.99" y el botón "Reserve" deshabilitado

#### Scenario: El pase no tapa el mapa
- **WHEN** el pase está fijo abajo en móvil
- **THEN** la última fila del mapa sigue siendo visible y pulsable al desplazar

### Requirement: Recuperación cuando el seat se pierde
Cuando el seat seleccionado deja de estar disponible, la UI SHALL mostrar "<label> was just taken. Pick another seat" (por ejemplo "A3 was just taken. Pick another seat") y SHALL devolver el foco al mapa. Este texto reemplaza a "Your selected seat is no longer available" de `web-events`.

#### Scenario: Seat tomado por otro
- **WHEN** el usuario refresca y su seat `A3` ya está `RESERVED`
- **THEN** ve "A3 was just taken. Pick another seat" y el foco queda en el mapa
