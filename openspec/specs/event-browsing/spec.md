# event-browsing Specification

## Purpose
Permite a cualquier persona, con o sin sesión, encontrar eventos en un listado paginado y filtrarlos por estado, tipo, fechas y nombre, con filtros que se pueden compartir por URL.

## Requirements

### Requirement: Listado público de eventos
La página de inicio SHALL mostrar los eventos de `GET /events` sin exigir sesión, en el orden que entrega la API. Cada evento SHALL mostrar nombre, tipo, lugar, fecha y hora de inicio en la zona horaria del navegador, precio con formato de moneda y estado. Un evento `CANCELLED` SHALL verse con la etiqueta "Cancelled". Cada evento SHALL enlazar a su detalle.

#### Scenario: Visitante abre el inicio
- **WHEN** un visitante abre "/"
- **THEN** ve la lista de eventos con nombre, tipo, lugar, fecha, precio y estado

#### Scenario: Evento cancelado en la lista
- **WHEN** la API devuelve un evento con `status` `CANCELLED`
- **THEN** el evento aparece con la etiqueta "Cancelled"

#### Scenario: Abrir un evento
- **WHEN** el usuario hace clic en un evento de la lista
- **THEN** la UI abre "/events/<id>"

### Requirement: Estados del listado
Mientras carga, el listado SHALL mostrar un indicador de carga. Sin resultados, SHALL mostrar "No events found". Si la consulta falla, SHALL mostrar el mensaje del error y un botón "Try again" que repite la consulta.

#### Scenario: Sin eventos
- **WHEN** la API responde `data` vacío
- **THEN** la UI muestra "No events found"

#### Scenario: Error y reintento
- **WHEN** la consulta falla y el usuario pulsa "Try again"
- **THEN** la UI repite la consulta y, si responde, muestra los eventos

### Requirement: Paginación
El listado SHALL pedir 12 eventos por página y mostrar "Page X of Y" con los botones "Previous" y "Next", deshabilitados en la primera y la última página. La página actual SHALL guardarse en la URL (`page`). Sin resultados no se muestra la paginación.

#### Scenario: Ir a la página siguiente
- **WHEN** el usuario pulsa "Next" en la página 1 de 3
- **THEN** la URL cambia a `page=2` y se muestran los eventos de la página 2

#### Scenario: Límites
- **WHEN** el usuario está en la página 1
- **THEN** "Previous" está deshabilitado; y en la última página, "Next" está deshabilitado

#### Scenario: Página fuera de rango
- **WHEN** la URL trae una página mayor que el total de páginas
- **THEN** la UI muestra "No events found" con un enlace "Go to first page"

### Requirement: Filtros
El listado SHALL ofrecer estos filtros:

| Filtro | Valores |
|---|---|
| Estado | "All statuses", "Active", "Cancelled" |
| Tipo | "All types", "Concert", "Meetup", "Meeting", "Other" |
| Fechas | "From" y "To", como fechas de calendario |
| Búsqueda | "Search by name" |

Las fechas SHALL enviarse como el inicio del día "From" y el final del día "To", en la zona horaria del navegador. La búsqueda SHALL consultar la API cuando el usuario deja de escribir, sin una solicitud por cada tecla. Cambiar cualquier filtro SHALL volver a la página 1. Un botón "Clear filters" SHALL quitar todos los filtros.

#### Scenario: Filtrar por tipo
- **WHEN** el usuario elige "Concert"
- **THEN** la UI consulta la API con `type=CONCERT` y `page=1`

#### Scenario: Rango de fechas
- **WHEN** el usuario elige From 2026-12-01 y To 2026-12-31
- **THEN** la UI consulta con `startFrom` al inicio del 1 de diciembre y `startTo` al final del 31 de diciembre, en hora local

#### Scenario: Rango invertido
- **WHEN** la fecha "From" es posterior a "To"
- **THEN** la UI muestra "'From' must be before 'To'" y no consulta la API

#### Scenario: Búsqueda
- **WHEN** el usuario escribe "rock" y deja de escribir
- **THEN** la UI hace una sola consulta con `search=rock`

#### Scenario: Limpiar filtros
- **WHEN** el usuario pulsa "Clear filters"
- **THEN** se quitan todos los filtros de la URL y se muestra la página 1 sin filtros

### Requirement: Filtros compartibles en la URL
Los filtros y la página SHALL leerse de la URL al abrir el listado y escribirse en ella al cambiarlos, de modo que recargar, compartir el enlace o usar atrás y adelante muestre el mismo resultado. Un valor inválido en la URL, como un tipo desconocido o una página no numérica, SHALL ignorarse sin mostrar error.

#### Scenario: Abrir un enlace con filtros
- **WHEN** alguien abre "/?type=MEETUP&status=ACTIVE&page=2"
- **THEN** los filtros aparecen seleccionados y se muestran los eventos de esa consulta

#### Scenario: Volver atrás
- **WHEN** el usuario cambia de filtro y luego pulsa atrás en el navegador
- **THEN** se restauran el filtro y los resultados anteriores

#### Scenario: Valor inválido en la URL
- **WHEN** la URL trae `type=FESTIVAL` o `page=abc`
- **THEN** la UI ignora ese valor y muestra el listado sin ese filtro, en la página 1
