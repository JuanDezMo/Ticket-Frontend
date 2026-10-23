## MODIFIED Requirements

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
