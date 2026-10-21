## Purpose

Define cómo se presenta el listado de eventos para que en un teléfono lo primero visible sean los eventos y la fecha de cada uno se lea de un vistazo.

## ADDED Requirements

### Requirement: Filtros plegados en móvil
En pantallas menores a 640 px, el listado SHALL mostrar visible solo la búsqueda y un botón "Filters" que indica cuántos filtros hay activos (por ejemplo "Filters (2)"). El botón abre un panel con estado, tipo, fechas y "Clear filters". En pantallas anchas los filtros SHALL seguir visibles. El comportamiento de los filtros (URL, debounce, validación del rango) no cambia.

#### Scenario: Primer evento visible
- **WHEN** un visitante abre "/" en una pantalla de 390 × 844 con eventos
- **THEN** la primera tarjeta de evento es visible sin desplazarse

#### Scenario: Contador de filtros
- **WHEN** la URL trae `type=CONCERT&status=ACTIVE`
- **THEN** el botón muestra "Filters (2)"

#### Scenario: Aplicar desde el panel
- **WHEN** el usuario abre el panel y elige "Concert"
- **THEN** el listado se filtra igual que antes y el panel se puede cerrar con Escape o con su botón

### Requirement: Jerarquía de la tarjeta
Cada tarjeta SHALL encabezar con la fecha (día y mes destacados, luego la hora), seguida del nombre, el tipo y el lugar, y el precio. La fecha y el nombre SHALL ser lo más prominente de la tarjeta.

#### Scenario: Fecha destacada
- **WHEN** se muestra un evento del 10 de noviembre a las 3:00 PM
- **THEN** la tarjeta encabeza con "Nov 10" destacado y la hora debajo

### Requirement: Eventos iniciados y cancelados
Un evento cuyo inicio ya pasó SHALL mostrar la etiqueta "Started"; uno cancelado mantiene "Cancelled". Ambos SHALL verse atenuados frente a los eventos reservables, conservando el contraste AA de su texto.

#### Scenario: Evento iniciado
- **WHEN** el `startDate` de un evento activo ya pasó
- **THEN** su tarjeta muestra "Started" y se ve atenuada

### Requirement: Paginación solo cuando hace falta
La paginación SHALL ocultarse cuando el resultado cabe en una sola página.

#### Scenario: Una sola página
- **WHEN** el listado tiene 5 eventos
- **THEN** no se muestran "Previous", "Next" ni "Page 1 of 1"
