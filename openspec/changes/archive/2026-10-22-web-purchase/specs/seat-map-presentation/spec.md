## MODIFIED Requirements

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
