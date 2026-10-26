# seat-reservation Specification

## Purpose
Permite a un comprador retener un seat durante un tiempo limitado, ver cuánto le queda desde cualquier página y cancelar la reserva si cambia de idea.

## Requirements

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

### Requirement: Límite de seats por evento
La UI SHALL limitar la selección a los seats que el USER todavía puede retener en el evento: `maxSeatsPerUser` del evento menos sus reservas en curso de ese evento (las de otros eventos no cuentan). Pulsar un seat disponible cuando ya se eligió el cupo completo MUST NOT seleccionarlo y SHALL avisar "You can select up to <N> seats". Con un máximo de 1, pulsar otro seat SHALL reemplazar la selección. Sin cupo (el USER ya retiene el máximo del evento), "Reserve" SHALL estar deshabilitado y el pase SHALL indicar "You are holding <N> seats, the most for this event. Finish or cancel them to reserve more" con un enlace "Continue to checkout". La UI MUST NOT suponer que su cuenta es exacta, porque no conoce lo ya comprado: SHALL mostrar "You can hold up to <N> seats for this event" (N de `maxSeatsPerUser` del evento, sin leer el texto del error) ante `409 SEAT_LIMIT_REACHED`, y "You have too many seats on hold. Pay or cancel some to reserve more" ante `409 HOLD_LIMIT_REACHED`, conservando la selección y actualizando el mapa.

#### Scenario: Hasta el límite
- **WHEN** el evento permite 3 seats, el USER eligió `C1`, `C2` y `C3` y pulsa `C4`
- **THEN** `C4` no se selecciona y la UI muestra "You can select up to 3 seats"

#### Scenario: Máximo de 1
- **WHEN** el evento permite 1 seat, el USER tiene `C1` seleccionado y pulsa `C2`
- **THEN** la selección pasa a `C2`

#### Scenario: Ya tiene una reserva
- **WHEN** el evento permite 2 seats y el USER ya retiene `C1` y `C2` del evento
- **THEN** "Reserve" está deshabilitado y el pase muestra "You are holding 2 seats, the most for this event" con el enlace "Continue to checkout"

#### Scenario: Reservas de otro evento
- **WHEN** el USER retiene 2 seats de otro evento y abre un evento que permite 2
- **THEN** puede elegir 2 seats y "Reserve" está habilitado

#### Scenario: Límite del evento en el servidor
- **WHEN** el evento permite 3 seats, el USER ya compró 2 antes y reserva 2 más, y la API responde `409 SEAT_LIMIT_REACHED`
- **THEN** la UI muestra "You can hold up to 3 seats for this event", conserva la selección y actualiza el mapa

#### Scenario: Tope global en el servidor
- **WHEN** la API responde `409 HOLD_LIMIT_REACHED`
- **THEN** la UI muestra "You have too many seats on hold. Pay or cancel some to reserve more" y conserva la selección

### Requirement: Reserva en curso recordada
La UI SHALL guardar en el navegador, mientras dure la pestaña, solo una lista con, por cada reserva en curso, su identificador, el evento, la etiqueta del seat, el monto, `createdAt` y `expiresAt`. Al abrir la aplicación SHALL validar cada reserva con la API. Una reserva que no esté `ACTIVE` (vencida, cancelada o pagada) SHALL descartarse, sin afectar a las demás. Un valor guardado con la forma anterior (una sola reserva) SHALL convertirse en una lista de una, sin fallar. Al cerrar o vencer la sesión SHALL borrarse todo.

#### Scenario: Recarga con reserva vigente
- **WHEN** el USER recarga la página con una reserva activa
- **THEN** el aviso de reserva y la cuenta regresiva siguen mostrándose con el tiempo restante correcto

#### Scenario: La reserva venció mientras no estaba
- **WHEN** el USER vuelve a abrir la aplicación con dos reservas y la API informa una como `EXPIRED` y la otra como `ACTIVE`
- **THEN** solo la vencida se descarta y el aviso muestra la que sigue activa

#### Scenario: Cierre de sesión
- **WHEN** el USER cierra sesión con reservas en curso
- **THEN** las reservas guardadas se borran

#### Scenario: Valor guardado anterior
- **WHEN** el navegador tiene guardada una sola reserva con la forma anterior y el USER abre la aplicación
- **THEN** la reserva pasa a una lista de una y el aviso se muestra sin errores

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

### Requirement: Cuenta regresiva
La cuenta regresiva SHALL mostrar minutos y segundos hasta `expiresAt` y una regla de 10 tramos que se consume en proporción al tiempo total de la reserva (de `createdAt` a `expiresAt`). Al llegar a cero, la UI SHALL volver a consultar la reserva y tomar su estado de la API. Los lectores de pantalla SHALL recibir un aviso en 5 minutos, en 1 minuto y al vencer, pero no cada segundo.

#### Scenario: Tiempo restante
- **WHEN** quedan 7 minutos y 42 segundos
- **THEN** se muestra "07:42" y 8 de los 10 tramos están encendidos

#### Scenario: Llega a cero
- **WHEN** la cuenta regresiva llega a "00:00"
- **THEN** la UI consulta la reserva y, si la API la informa `EXPIRED`, muestra que venció

#### Scenario: Avisos accesibles
- **WHEN** la cuenta regresiva pasa por 1 minuto
- **THEN** un aviso para lectores de pantalla dice "One minute left to pay"

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
