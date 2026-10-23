## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Datos del evento centrados en quien compra
El encabezado del detalle SHALL mostrar el precio en letra de bloque y, en lugar de la capacidad, la cantidad de seats: con sesión "N left" (los disponibles según el mapa); sin sesión, el total de seats del evento.

#### Scenario: Con sesión
- **WHEN** un usuario con sesión abre un evento de 25 seats con 23 disponibles
- **THEN** el encabezado muestra "23 left" junto a "Seats"

#### Scenario: Sin sesión
- **WHEN** un visitante abre ese evento
- **THEN** el encabezado muestra "25 seats"
