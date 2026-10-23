## MODIFIED Requirements

### Requirement: Reservar los seats seleccionados
Un USER con uno o más seats seleccionados en un evento reservable SHALL poder pulsar "Reserve", que envía una sola solicitud de reserva con el evento y la lista de seats. La reserva es todo o nada: o se reservan todos o ninguno. Mientras responde, el botón SHALL mostrar "Reserving..." y quedar deshabilitado. Con una respuesta exitosa, la UI SHALL guardar las reservas en curso, limpiar la selección, actualizar el mapa de seats y llevar al checkout de las reservas creadas: "/checkout/<id>" con una y "/checkout?ids=<ids>" con varias. La UI MUST NOT reintentar la solicitud automáticamente ni dar por reservado ningún seat tras un error.

#### Scenario: Reserva exitosa
- **WHEN** el USER pulsa "Reserve" con `C7` seleccionado y la API responde `201`
- **THEN** la UI abre "/checkout/<id de la reserva>", la selección queda vacía y el seat `C7` ya no está disponible en el mapa

#### Scenario: Reserva de varios seats
- **WHEN** el USER pulsa "Reserve" con `C7` y `C8` seleccionados y la API responde `201` con dos reservas
- **THEN** se envió una sola solicitud con los dos seats, las dos reservas quedan en curso, la selección queda vacía y la UI abre el checkout de las dos reservas

#### Scenario: Doble pulsación
- **WHEN** el USER pulsa "Reserve" dos veces seguidas
- **THEN** se envía una sola solicitud

#### Scenario: El seat ya lo tomaron
- **WHEN** la API responde `409 SEAT_NOT_AVAILABLE` a una reserva de `C7` y `C8` y, al actualizar el mapa, `C8` ya no está disponible
- **THEN** la UI muestra "This seat is no longer available. Please choose another one", no guarda ninguna reserva, actualiza el mapa y deja seleccionado solo `C7`

#### Scenario: El evento ya no admite reservas
- **WHEN** la API responde `409 EVENT_NOT_ACTIVE`
- **THEN** la UI muestra "This event is no longer available for booking" y actualiza el evento

#### Scenario: Fallo de red
- **WHEN** la solicitud falla por red
- **THEN** la UI muestra el error, conserva la selección y deja "Reserve" habilitado para que el usuario reintente

### Requirement: Aviso de reserva en curso
Mientras haya reservas `ACTIVE` en curso, la UI SHALL mostrar debajo del encabezado, en todas las páginas excepto el checkout que ya incluye la reserva a la que enlaza, un aviso con los seats retenidos ("Seat C7 is held" con una; "3 seats held" con varias), el tiempo hasta el vencimiento más próximo y un enlace "Continue to checkout" al checkout de las reservas en curso del mismo evento que la que vence primero.

#### Scenario: Navegar con una reserva activa
- **WHEN** el USER con la reserva `C7` activa abre el listado de eventos
- **THEN** ve "Seat C7 is held" con el tiempo restante y "Continue to checkout"

#### Scenario: Varias reservas
- **WHEN** el USER retiene `C7`, `C8` y `C9` del mismo evento y abre el listado de eventos
- **THEN** ve "3 seats held" con el tiempo hasta el primer vencimiento y "Continue to checkout" hacia el checkout de las tres

#### Scenario: Reservas de dos eventos
- **WHEN** el USER retiene `C7` de un evento y `A1` y `A2` de otro, y `C7` vence primero
- **THEN** "Continue to checkout" lleva al checkout de `C7` solamente, porque una compra es de un solo evento

#### Scenario: En el checkout
- **WHEN** el USER está en el checkout que incluye la reserva a la que enlazaría el aviso
- **THEN** el aviso no aparece, porque la cuenta regresiva ya está en la página

#### Scenario: La reserva termina
- **WHEN** la reserva se vence, se cancela o se paga
- **THEN** el aviso desaparece, o pasa a contar solo las que siguen activas

### Requirement: Cancelar la reserva
El checkout SHALL ofrecer "Cancel reservation", que pide confirmación antes de enviar la cancelación; con varias reservas vigentes cancela todas las del grupo ("Cancel all") y cada seat ofrece además "Remove <label>" para cancelar solo esa. Mientras haya un pago en curso, estos botones SHALL estar deshabilitados. Con una cancelación exitosa, la UI SHALL descartar esas reservas de las reservas en curso (las demás siguen), actualizar el mapa de seats del evento y, si cancelaron todas, mostrar "Reservation cancelled" ("Reservations cancelled" con varias) y volver al detalle del evento.

#### Scenario: Cancelación confirmada
- **WHEN** el USER pulsa "Cancel reservation" y confirma
- **THEN** la reserva se cancela, vuelve al evento y el seat figura como disponible

#### Scenario: Cancelar todo el grupo
- **WHEN** el USER con `C7` y `C8` en el checkout pulsa "Cancel all" y confirma
- **THEN** las dos reservas se cancelan, la UI muestra "Reservations cancelled", vuelve al evento y los dos seats figuran como disponibles

#### Scenario: No confirma
- **WHEN** el USER pulsa "Cancel reservation" y cierra el diálogo
- **THEN** no se envía ninguna solicitud y la reserva sigue activa

#### Scenario: Pago en curso
- **WHEN** hay un pago en curso
- **THEN** "Cancel reservation" está deshabilitado

#### Scenario: La reserva ya estaba pagada
- **WHEN** la API responde `409 RESERVATION_ALREADY_CONFIRMED` a la cancelación
- **THEN** la UI lleva a "My tickets"

#### Scenario: Las demás reservas siguen
- **WHEN** el USER retiene `C7` y `C8` y cancela la reserva de `C7`
- **THEN** `C8` sigue en curso y el aviso muestra "Seat C8 is held"
