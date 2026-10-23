## Purpose

Permite pagar una reserva con tarjeta, deja claro qué hacer ante cada resultado del pago y confirma el ticket emitido, sin guardar nunca datos de la tarjeta.

## ADDED Requirements

### Requirement: Página de checkout
"/checkout/:reservationId" SHALL ser accesible solo con sesión de USER. Con una reserva `ACTIVE`, SHALL mostrar el seat, el nombre y la fecha del evento, el monto en USD, la cuenta regresiva y el formulario de pago. Los demás estados SHALL mostrar su propio mensaje con la siguiente acción:

| Estado o error | Mensaje | Acción |
|---|---|---|
| `EXPIRED` | "This reservation has expired" | "Back to event" |
| `CANCELLED` o `CANCELLED_BY_USER` | "This reservation was cancelled" | "Back to event" |
| `CONFIRMED` | "This reservation is already paid" | "View my tickets" |
| `404` o `403` | "Reservation not found" | "Back to events" |
| id que no es UUID | "Reservation not found", sin llamar a la API | "Back to events" |

#### Scenario: Reserva activa
- **WHEN** un USER abre el checkout de su reserva `C7` de $49.99
- **THEN** ve "C7", el evento, "$49.99", la cuenta regresiva y el formulario de tarjeta

#### Scenario: Reserva vencida
- **WHEN** la API informa la reserva como `EXPIRED`
- **THEN** la UI muestra "This reservation has expired" y no el formulario

#### Scenario: Visitante
- **WHEN** un visitante abre "/checkout/<id>"
- **THEN** la UI lo lleva al login y, tras iniciar sesión, vuelve al checkout

#### Scenario: Reserva ajena
- **WHEN** la API responde `403` a la consulta
- **THEN** la UI muestra "Reservation not found" y un enlace al listado

### Requirement: Formulario de tarjeta
El formulario SHALL pedir franquicia ("VISA", "MASTERCARD" o "AMEX"), número, vencimiento (`MM/YY`) y CVV, y validar antes de enviar: número de 13 a 19 dígitos (se aceptan espacios), vencimiento con formato válido y no vencido, y CVV de 3 dígitos. Los campos SHALL tener los atributos de autocompletado del navegador para tarjetas y el botón SHALL decir "Pay <monto>". Los datos de la tarjeta MUST NOT guardarse en el navegador, en la caché de consultas, en la URL ni en los registros, y SHALL descartarse al salir de la página.

#### Scenario: Datos inválidos en el cliente
- **WHEN** el USER envía un número de 10 dígitos o un vencimiento pasado
- **THEN** la UI muestra el error junto al campo y no envía nada

#### Scenario: Espacios en el número
- **WHEN** el USER escribe "4111 1111 1111 1111"
- **THEN** se acepta y a la API se envían solo los dígitos

#### Scenario: Sin persistencia
- **WHEN** el USER escribe una tarjeta y recarga la página
- **THEN** el formulario aparece vacío y nada de la tarjeta está en `localStorage` ni `sessionStorage`

### Requirement: Un pago, una solicitud
Al pagar, la UI SHALL enviar una sola solicitud de compra con la reserva y la tarjeta. Mientras responde, el botón SHALL mostrar "Paying..." y el formulario y "Cancel reservation" SHALL quedar deshabilitados. La UI MUST NOT reintentar la compra automáticamente: el reintento lo inicia el usuario.

#### Scenario: Pago en curso
- **WHEN** el USER pulsa "Pay $49.99"
- **THEN** el botón muestra "Paying...", los campos y "Cancel reservation" están deshabilitados y se envía una sola solicitud

#### Scenario: Doble pulsación
- **WHEN** el USER pulsa "Pay" dos veces seguidas
- **THEN** se envía una sola solicitud

### Requirement: Una salida para cada resultado del pago
La UI SHALL responder a cada resultado así:

| Respuesta | Qué ve el usuario | Qué pasa con el formulario |
|---|---|---|
| `201` o `200` | Ticket emitido | Se reemplaza por la confirmación |
| `402 PAYMENT_REJECTED` | "Payment was rejected. Please try another card" | Se vacían número y CVV; el foco va al número |
| `422 CARD_PROBLEM` | "The card has problems. Please use another payment method" | Se vacían número y CVV; el foco va al número |
| `502 PAYMENT_GATEWAY_ERROR` | "Payment service error. Please try again" | Se conservan los datos; "Pay" sirve para reintentar |
| `504 PAYMENT_GATEWAY_TIMEOUT` | "Payment service timed out. Please try again. You will not be charged twice" | Se conservan los datos; "Pay" sirve para reintentar |
| `400 VALIDATION_ERROR`, `CARD_BRAND_REQUIRED` o `CARD_BRAND_NOT_ALLOWED` | El mensaje junto al campo | Se conservan los datos |
| `409 RESERVATION_EXPIRED` | "This reservation has expired" | Se reemplaza por el estado vencido |
| `409 EVENT_CANCELLED` | "This event has been cancelled" | Se reemplaza por un mensaje con "Back to events" |
| `409 RESERVATION_ALREADY_CANCELLED` | "This reservation was cancelled" | Se reemplaza por el estado cancelado |
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
- **THEN** la UI explica que reintentar es seguro y que no se cobra dos veces

#### Scenario: Reserva vencida durante el pago
- **WHEN** la API responde `409 RESERVATION_EXPIRED`
- **THEN** la UI descarta la reserva en curso y muestra "This reservation has expired"

### Requirement: Pago bloqueado al vencer
Cuando la cuenta regresiva llegue a cero, "Pay" SHALL deshabilitarse y la UI SHALL mostrar que la reserva venció una vez que la API lo confirme.

#### Scenario: Vence con el formulario abierto
- **WHEN** la cuenta regresiva llega a cero y la API informa `EXPIRED`
- **THEN** el formulario se reemplaza por "This reservation has expired"

### Requirement: Ticket emitido
Con una compra exitosa, la UI SHALL descartar la reserva en curso, actualizar el mapa de seats y mostrar una confirmación con el seat en letra de bloque, el evento, la fecha, el monto pagado y los enlaces "View my tickets" y "Back to events". Repetir la compra de una reserva ya pagada (respuesta `200`) SHALL mostrar la misma confirmación.

#### Scenario: Pago aprobado
- **WHEN** la API responde `201` con el ticket de `C7`
- **THEN** la UI muestra "Ticket issued" con "C7", el evento y el monto, y el aviso de reserva desaparece

#### Scenario: Reserva ya pagada
- **WHEN** el USER recarga el checkout de una reserva pagada
- **THEN** ve "This reservation is already paid" con "View my tickets"
