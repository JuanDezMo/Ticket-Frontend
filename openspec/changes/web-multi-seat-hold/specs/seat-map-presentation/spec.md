## MODIFIED Requirements

### Requirement: Pase de selección
Mientras un USER tenga seats seleccionados en un evento reservable, la UI SHALL mostrar el pase con los códigos de los seats, el precio total y el botón "Reserve" habilitado ("Reserve <N> seats" con más de uno), con la nota "Held for 10 minutes once reserved". Cuando el evento permite más de un seat por comprador, el pase SHALL indicar cuántos seats se eligieron de cuántos se pueden elegir ("2 of 4 seats selected"). En móvil el pase SHALL ir fijo al borde inferior en una sola fila de no más de 120 px: muestra hasta 3 códigos y resume el resto como "+N", y el evento, la lista completa de seats y la regla visual de los 10 minutos SHALL estar en un detalle desplegable "Details". Desde `lg` el pase SHALL mostrar todo a la vez en una columna fija. Sin selección, el pase SHALL invitar a elegir un seat.

#### Scenario: Seat elegido
- **WHEN** el USER selecciona `C7` en un evento de $49.99 en una pantalla de 390 px
- **THEN** el pase muestra "C7", "$49.99" y "Reserve" habilitado en una sola fila, y mide no más de 120 px

#### Scenario: Varios seats
- **WHEN** el USER selecciona `C7` y `C8` en un evento de $49.99 que permite 4 seats
- **THEN** el pase muestra "C7, C8", "$99.98", "Reserve 2 seats" y "2 of 4 seats selected"

#### Scenario: Muchos seats en móvil
- **WHEN** el USER selecciona 8 seats en una pantalla de 390 px
- **THEN** el pase muestra tres códigos y "+5", mide no más de 120 px, y "Details" lista los 8

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
Cuando uno o más seats seleccionados dejan de estar disponibles, la UI SHALL quitarlos de la selección, conservar los demás, mostrar "<label> was just taken. Pick another seat" (por ejemplo "A3 was just taken. Pick another seat") o, con varios, "<A3, A4 and A5> were just taken. Pick other seats", y SHALL devolver el foco al mapa. Este texto reemplaza a "Your selected seat is no longer available" de `web-events`.

#### Scenario: Seat tomado por otro
- **WHEN** el usuario refresca y su seat `A3` ya está `RESERVED`
- **THEN** ve "A3 was just taken. Pick another seat" y el foco queda en el mapa

#### Scenario: Varios seats tomados
- **WHEN** el usuario eligió `A3`, `A4` y `A5` y, al refrescar, `A3` y `A4` ya están `RESERVED`
- **THEN** ve "A3 and A4 were just taken. Pick other seats", `A5` sigue seleccionado y el foco queda en el mapa

### Requirement: La reserva se explica antes de elegir
El encabezado del mapa SHALL decir, antes de elegir, que un seat reservado se retiene 10 minutos mientras se paga y, si el evento permite más de un seat por comprador, cuántos se pueden elegir.

#### Scenario: Antes de elegir
- **WHEN** un USER abre el detalle de un evento reservable que permite 1 seat por comprador
- **THEN** el encabezado del mapa muestra "Pick a seat. Once reserved, it is held for 10 minutes while you pay."

#### Scenario: Más de un seat por comprador
- **WHEN** un USER abre el detalle de un evento reservable que permite 4 seats por comprador
- **THEN** el encabezado del mapa muestra "Pick up to 4 seats. Once reserved, they are held for 10 minutes while you pay."
