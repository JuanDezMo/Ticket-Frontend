## RENAMED Requirements

- FROM: `### Requirement: Selección de un seat`
- TO: `### Requirement: Selección de seats`

## MODIFIED Requirements

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
