# my-tickets Specification

## Purpose
Muestra al comprador los tickets que ya pagó, con el estado de cada uno, para que los encuentre sin volver al evento.

## Requirements

### Requirement: Lista de mis tickets
"/my-tickets" SHALL mostrar, solo a un USER con sesión, sus tickets de `GET /tickets/me`, en el orden de la API y paginados de a 12, con la página en la URL (`page`). Cada ticket SHALL mostrar el seat en letra de bloque, el nombre, el lugar y la fecha del evento, el monto pagado y la fecha de emisión, y SHALL enlazar al detalle del evento.

#### Scenario: Usuario con tickets
- **WHEN** un USER con 2 tickets abre "/my-tickets"
- **THEN** ve los dos con su seat, evento, lugar, fecha y monto

#### Scenario: Paginación
- **WHEN** el USER tiene 30 tickets y pulsa "Next" en la página 1
- **THEN** la URL cambia a `page=2` y se muestran los tickets de esa página

#### Scenario: Abrir el evento
- **WHEN** el USER pulsa un ticket
- **THEN** la UI abre "/events/<id del evento>"

### Requirement: Tickets de eventos cancelados
Un ticket con estado `CANCELLED_BY_EVENT` SHALL mostrarse con la etiqueta "Cancelled by organizer" y atenuado, conservando el contraste del texto.

#### Scenario: Evento cancelado
- **WHEN** la API devuelve un ticket `CANCELLED_BY_EVENT`
- **THEN** su tarjeta muestra "Cancelled by organizer" y se ve atenuada

### Requirement: Estados de la lista
Mientras carga, la lista SHALL mostrar un indicador de carga. Sin tickets, SHALL mostrar "You have no tickets yet" y un enlace "Browse events". Si la consulta falla, SHALL mostrar el mensaje del error y "Try again". La paginación SHALL ocultarse con una sola página.

#### Scenario: Sin tickets
- **WHEN** la API responde `data` vacío
- **THEN** la UI muestra "You have no tickets yet" y "Browse events"

#### Scenario: Error y reintento
- **WHEN** la consulta falla y el USER pulsa "Try again"
- **THEN** la UI repite la consulta

#### Scenario: Acceso
- **WHEN** un ADMIN abre "/my-tickets"
- **THEN** la UI muestra la página de sin permiso
