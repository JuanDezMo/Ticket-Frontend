# seat-reservation Specification

## Purpose
Permite a un comprador retener un seat durante un tiempo limitado, ver cuánto le queda desde cualquier página y cancelar la reserva si cambia de idea.

## Requirements

### Requirement: Reservar el seat seleccionado
Un USER con un seat seleccionado en un evento reservable SHALL poder pulsar "Reserve", que envía una sola solicitud de reserva con el evento y el seat. Mientras responde, el botón SHALL mostrar "Reserving..." y quedar deshabilitado. Con una respuesta exitosa, la UI SHALL guardar la reserva en curso, limpiar la selección, actualizar el mapa de seats y llevar al checkout de esa reserva. La UI MUST NOT reintentar la solicitud automáticamente.

#### Scenario: Reserva exitosa
- **WHEN** el USER pulsa "Reserve" con `C7` seleccionado y la API responde `201`
- **THEN** la UI abre "/checkout/<id de la reserva>", la selección queda vacía y el seat `C7` ya no está disponible en el mapa

#### Scenario: Doble pulsación
- **WHEN** el USER pulsa "Reserve" dos veces seguidas
- **THEN** se envía una sola solicitud

#### Scenario: El seat ya lo tomaron
- **WHEN** la API responde `409 SEAT_NOT_AVAILABLE`
- **THEN** la UI muestra "This seat is no longer available. Please choose another one", actualiza el mapa y quita la selección

#### Scenario: El evento ya no admite reservas
- **WHEN** la API responde `409 EVENT_NOT_ACTIVE`
- **THEN** la UI muestra "This event is no longer available for booking" y actualiza el evento

#### Scenario: Fallo de red
- **WHEN** la solicitud falla por red
- **THEN** la UI muestra el error, conserva la selección y deja "Reserve" habilitado para que el usuario reintente

### Requirement: Una sola reserva a la vez
Mientras el USER tenga una reserva activa en curso, "Reserve" SHALL estar deshabilitado y el pase SHALL indicar "You are holding <seat>. Finish or cancel it to reserve another" con un enlace "Continue to checkout".

#### Scenario: Ya tiene una reserva
- **WHEN** el USER con la reserva `C7` activa selecciona otro seat
- **THEN** "Reserve" está deshabilitado y el pase muestra "You are holding C7" con el enlace "Continue to checkout"

### Requirement: Reserva en curso recordada
La UI SHALL guardar en el navegador, mientras dure la pestaña, solo el identificador de la reserva en curso, el evento, la etiqueta del seat, el monto y `expiresAt`. Al abrir la aplicación SHALL validar esa reserva con la API. Una reserva que no esté `ACTIVE` (vencida, cancelada o pagada) SHALL descartarse. Al cerrar o vencer la sesión SHALL borrarse.

#### Scenario: Recarga con reserva vigente
- **WHEN** el USER recarga la página con una reserva activa
- **THEN** el aviso de reserva y la cuenta regresiva siguen mostrándose con el tiempo restante correcto

#### Scenario: La reserva venció mientras no estaba
- **WHEN** el USER vuelve a abrir la aplicación y la API informa la reserva como `EXPIRED`
- **THEN** la reserva en curso se descarta y no se muestra ningún aviso

#### Scenario: Cierre de sesión
- **WHEN** el USER cierra sesión con una reserva en curso
- **THEN** la reserva guardada se borra

### Requirement: Aviso de reserva en curso
Mientras haya una reserva `ACTIVE` en curso, la UI SHALL mostrar debajo del encabezado, en todas las páginas excepto el checkout de esa reserva, un aviso con el seat, el tiempo que queda y un enlace "Continue to checkout".

#### Scenario: Navegar con una reserva activa
- **WHEN** el USER con la reserva `C7` activa abre el listado de eventos
- **THEN** ve "Seat C7 is held" con el tiempo restante y "Continue to checkout"

#### Scenario: En el checkout
- **WHEN** el USER está en el checkout de su reserva
- **THEN** el aviso no aparece, porque la cuenta regresiva ya está en la página

#### Scenario: La reserva termina
- **WHEN** la reserva se vence, se cancela o se paga
- **THEN** el aviso desaparece

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
El checkout SHALL ofrecer "Cancel reservation", que pide confirmación antes de enviar la cancelación. Mientras haya un pago en curso, el botón SHALL estar deshabilitado. Con una cancelación exitosa, la UI SHALL descartar la reserva en curso, actualizar el mapa de seats del evento, mostrar "Reservation cancelled" y volver al detalle del evento.

#### Scenario: Cancelación confirmada
- **WHEN** el USER pulsa "Cancel reservation" y confirma
- **THEN** la reserva se cancela, vuelve al evento y el seat figura como disponible

#### Scenario: No confirma
- **WHEN** el USER pulsa "Cancel reservation" y cierra el diálogo
- **THEN** no se envía ninguna solicitud y la reserva sigue activa

#### Scenario: Pago en curso
- **WHEN** hay un pago en curso
- **THEN** "Cancel reservation" está deshabilitado

#### Scenario: La reserva ya estaba pagada
- **WHEN** la API responde `409 RESERVATION_ALREADY_CONFIRMED` a la cancelación
- **THEN** la UI lleva a "My tickets"
