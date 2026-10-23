## MODIFIED Requirements

### Requirement: Página de checkout
"/checkout/:reservationId" (una reserva) y "/checkout?ids=<id>,<id>" (de 1 a 8 reservas del mismo evento) SHALL ser accesibles solo con sesión de USER. Con al menos una reserva `ACTIVE`, SHALL mostrar los seats vigentes, el nombre y la fecha del evento, el monto total en USD, la cuenta regresiva de la que vence primero y el formulario de pago. Los demás estados SHALL mostrar su propio mensaje con la siguiente acción:

| Estado o error | Mensaje | Acción |
|---|---|---|
| todas `EXPIRED` | "This reservation has expired" | "Back to event" |
| todas `CANCELLED` o `CANCELLED_BY_USER` | "This reservation was cancelled" | "Back to event" |
| todas `CONFIRMED` | "This reservation is already paid" ("These reservations are already paid" con varias) | "View my tickets" |
| `404` o `403` en alguna | "Reservation not found" | "Back to events" |
| algún id que no es UUID, repetido, más de 8, o de eventos distintos | "Reservation not found", sin llamar a la API cuando el id no es válido | "Back to events" |

#### Scenario: Reserva activa
- **WHEN** un USER abre el checkout de su reserva `C7` de $49.99
- **THEN** ve "C7", el evento, "$49.99", la cuenta regresiva y el formulario de tarjeta

#### Scenario: Grupo de reservas
- **WHEN** un USER abre "/checkout?ids=" con las reservas `C7` y `C8` de $49.99 cada una
- **THEN** ve "C7" y "C8", el total "$99.98", la cuenta regresiva de la que vence primero y un solo formulario de tarjeta con el botón "Pay $99.98"

#### Scenario: Reserva vencida
- **WHEN** la API informa la reserva como `EXPIRED`
- **THEN** la UI muestra "This reservation has expired" y no el formulario

#### Scenario: Enlace de grupo inválido
- **WHEN** el USER abre "/checkout?ids=" con un id que no es UUID, con un id repetido, o con 9 ids
- **THEN** la UI muestra "Reservation not found" sin llamar a la API

#### Scenario: Visitante
- **WHEN** un visitante abre "/checkout/<id>" o "/checkout?ids=<ids>"
- **THEN** la UI lo lleva al login y, tras iniciar sesión, vuelve al mismo checkout

#### Scenario: Reserva ajena
- **WHEN** la API responde `403` a la consulta
- **THEN** la UI muestra "Reservation not found" y un enlace al listado

### Requirement: Un pago, una solicitud
Al pagar, la UI SHALL enviar una sola solicitud de compra con las reservas vigentes del grupo (`reservationIds`) y la tarjeta. Mientras responde, el botón SHALL mostrar "Paying..." y el formulario, "Cancel reservation" y "Remove" SHALL quedar deshabilitados. La UI MUST NOT reintentar la compra automáticamente: el reintento lo inicia el usuario.

#### Scenario: Pago en curso
- **WHEN** el USER pulsa "Pay $49.99"
- **THEN** el botón muestra "Paying...", los campos y "Cancel reservation" están deshabilitados y se envía una sola solicitud

#### Scenario: Doble pulsación
- **WHEN** el USER pulsa "Pay" dos veces seguidas
- **THEN** se envía una sola solicitud

#### Scenario: Pago de un grupo
- **WHEN** el USER paga un grupo de 3 reservas
- **THEN** se envía una sola solicitud con las 3 reservas y la tarjeta

### Requirement: Una salida para cada resultado del pago
La UI SHALL responder a cada resultado así:

| Respuesta | Qué ve el usuario | Qué pasa con el formulario |
|---|---|---|
| `201` | Tickets emitidos | Se reemplaza por la confirmación |
| `402 PAYMENT_REJECTED` | "Payment was rejected. Please try another card" | Se vacían número y CVV; el foco va al número |
| `422 CARD_PROBLEM` | "The card has problems. Please use another payment method" | Se vacían número y CVV; el foco va al número |
| `502 PAYMENT_GATEWAY_ERROR` | "Payment service error. Please try again" | Se conservan los datos; "Pay" sirve para reintentar |
| `504 PAYMENT_GATEWAY_TIMEOUT` | "Payment service timed out. Please try again in a few seconds. You will not be charged twice" | Se conservan los datos; "Pay" sirve para reintentar |
| `409 PAYMENT_IN_PROGRESS` | "Your payment is being processed. Try again in a few seconds" | Se conservan los datos; no es un pago fallido |
| `409 DUPLICATE_PAYMENT` | "These reservations were already paid" | Se reemplaza por "ya pagada" con "View my tickets" |
| `400 VALIDATION_ERROR`, `CARD_BRAND_REQUIRED` o `CARD_BRAND_NOT_ALLOWED` | El mensaje junto al campo | Se conservan los datos |
| `400 ORDER_AMOUNT_TOO_LARGE` | "The order total exceeds the maximum allowed. Pay fewer seats at once" | Se conservan los datos |
| `400 RESERVATIONS_MISMATCH` | El mensaje genérico (es un defecto, no se reintenta solo) | Se conservan los datos |
| `409 RESERVATION_EXPIRED` o `RESERVATION_ALREADY_CANCELLED` | La UI consulta cada reserva y muestra cuáles ya no están vigentes | Con reservas vigentes, se puede pagar lo que sigue; sin ninguna, se reemplaza por el estado que corresponda |
| `409 EVENT_CANCELLED` | "This event has been cancelled" | Se reemplaza por un mensaje con "Back to events" |
| `404` o `403` | "Reservation not found" | Se reemplaza por ese estado |
| Fallo de red o `500` | El mensaje genérico | Se conservan los datos |

#### Scenario: Pago rechazado
- **WHEN** la API responde `402`
- **THEN** la UI muestra "Payment was rejected. Please try another card", vacía número y CVV y pone el foco en el número

#### Scenario: Error temporal
- **WHEN** la API responde `502`
- **THEN** la UI muestra el mensaje, conserva todos los datos y "Pay" queda habilitado para reintentar

#### Scenario: Tiempo agotado
- **WHEN** la API responde `504`
- **THEN** la UI explica que reintentar es seguro, que no se cobra dos veces y que conviene esperar unos segundos

#### Scenario: Pago en curso en el servidor
- **WHEN** la API responde `409 PAYMENT_IN_PROGRESS`
- **THEN** la UI muestra "Your payment is being processed. Try again in a few seconds", conserva los datos de la tarjeta y no muestra "ya pagada" ni "pago rechazado"

#### Scenario: Compra duplicada
- **WHEN** la API responde `409 DUPLICATE_PAYMENT`
- **THEN** la UI descarta esas reservas de las reservas en curso, muestra que ya están pagadas y ofrece "View my tickets"

#### Scenario: Reserva vencida durante el pago
- **WHEN** la API responde `409 RESERVATION_EXPIRED`
- **THEN** la UI descarta la reserva en curso y muestra "This reservation has expired"

#### Scenario: Vence una del grupo durante el pago
- **WHEN** el USER paga `C7` y `C8` y la API responde `409 RESERVATION_EXPIRED` porque `C7` venció
- **THEN** la UI consulta las dos reservas, avisa que `C7` ya no está vigente, descarta solo esa y deja pagar `C8` con el total actualizado

### Requirement: Pago bloqueado al vencer
Cuando la cuenta regresiva de la reserva que vence primero llegue a cero, "Pay" SHALL deshabilitarse y la UI SHALL volver a consultar todas las reservas del grupo. Mientras la API no confirme el estado, el pago permanece bloqueado; al confirmarlo, SHALL mostrar cuáles ya no están vigentes y permitir pagar las que sí lo están, o el estado vencido si ninguna lo está.

#### Scenario: Vence con el formulario abierto
- **WHEN** la cuenta regresiva llega a cero y la API informa `EXPIRED`
- **THEN** el formulario se reemplaza por "This reservation has expired"

#### Scenario: Vence una del grupo con el formulario abierto
- **WHEN** vence `C7` y `C8` sigue `ACTIVE`
- **THEN** "Pay" queda bloqueado hasta que la API confirma, y después el formulario sigue disponible solo para `C8` con su total y su propia cuenta regresiva

### Requirement: Ticket emitido
Con una compra exitosa, la UI SHALL descartar las reservas pagadas de las reservas en curso, actualizar el mapa de seats y mostrar una confirmación con cada seat en letra de bloque, el evento, la fecha, el total pagado y los enlaces "View my tickets" y "Back to events". Con un solo ticket el título es "Ticket issued" y con varios, "Tickets issued". Repetir la compra de reservas ya pagadas (`409 DUPLICATE_PAYMENT`) SHALL mostrar que ya están pagadas.

#### Scenario: Pago aprobado
- **WHEN** la API responde `201` con el ticket de `C7`
- **THEN** la UI muestra "Ticket issued" con "C7", el evento y el monto, y el aviso de reserva desaparece

#### Scenario: Pago de un grupo
- **WHEN** la API responde `201` con los tickets de `C7`, `C8` y `C9` y un total de $149.97
- **THEN** la UI muestra "Tickets issued" con los tres seats, el evento y "$149.97", y el aviso de reserva desaparece

#### Scenario: Reserva ya pagada
- **WHEN** el USER recarga el checkout de una reserva pagada
- **THEN** ve "This reservation is already paid" con "View my tickets"

## ADDED Requirements

### Requirement: Reservas del grupo que ya no están vigentes
Cuando alguna reserva del grupo ya no esté `ACTIVE` pero otras sí, el checkout SHALL avisar cuáles dejaron de estar vigentes ("<seats> can no longer be paid: expired or cancelled") con un enlace "Back to event", mostrar y cobrar solo las vigentes, y descartar las demás de las reservas en curso. La UI MUST NOT suponer cuál venció a partir de un error de la compra: SHALL consultar cada reserva.

#### Scenario: Una del grupo ya no está vigente
- **WHEN** el USER abre el checkout de `C7` y `C8` y la API informa `C7` como `EXPIRED` y `C8` como `ACTIVE`
- **THEN** ve "C7 can no longer be paid", el formulario con solo `C8` y su monto, y `C7` ya no figura en las reservas en curso

### Requirement: Quitar un seat del grupo
Con más de una reserva vigente en el checkout, cada seat SHALL ofrecer "Remove <label>", que pide confirmación antes de cancelar solo esa reserva. Mientras haya un pago en curso, estos botones SHALL estar deshabilitados. Con éxito, la UI SHALL quitar el seat del grupo, del enlace y de las reservas en curso, actualizar el mapa de seats del evento y recalcular el total y el vencimiento. Con una sola reserva vigente, SHALL ofrecerse solo "Cancel reservation".

#### Scenario: Quitar un seat
- **WHEN** el USER con `C7`, `C8` y `C9` en el checkout pulsa "Remove C8" y confirma
- **THEN** la reserva de `C8` se cancela, el checkout muestra `C7` y `C9` con el total de dos seats y `C8` vuelve a estar disponible en el mapa

#### Scenario: No confirma
- **WHEN** el USER pulsa "Remove C8" y cierra el diálogo
- **THEN** no se envía ninguna solicitud y el grupo no cambia

#### Scenario: Pago en curso
- **WHEN** hay un pago en curso
- **THEN** "Remove C8" y "Cancel reservation" están deshabilitados

#### Scenario: Una sola vigente
- **WHEN** el grupo tiene una sola reserva vigente
- **THEN** no hay botones "Remove" y sí "Cancel reservation"
