## Purpose

Define cómo la UI se comunica con `ticket-api`: a dónde envía las solicitudes, cómo se autentica y cómo convierte cada error de la API en un mensaje y una acción comprensibles para el usuario.

## ADDED Requirements

### Requirement: Solicitudes a la API por una ruta base configurable
La UI SHALL enviar todas las solicitudes a `ticket-api` bajo una ruta base configurable (por defecto `/api`), que en desarrollo se redirige a la API sin requerir CORS.

#### Scenario: Solicitud en desarrollo
- **WHEN** la UI corre en modo desarrollo y pide `GET /events`
- **THEN** la solicitud sale a `/api/events` y la recibe `ticket-api` en `/events`

#### Scenario: Ruta base distinta
- **WHEN** se configura otra URL base para la API
- **THEN** todas las solicitudes usan esa URL sin cambios en las pantallas

### Requirement: Envío del token de sesión
La UI SHALL enviar `Authorization: Bearer <token>` en cada solicitud mientras haya una sesión activa, y MUST NOT enviarlo cuando no la hay.

#### Scenario: Usuario con sesión
- **WHEN** un usuario con sesión hace una solicitud
- **THEN** la solicitud incluye su token en el header `Authorization`

#### Scenario: Visitante
- **WHEN** un visitante sin sesión hace una solicitud
- **THEN** la solicitud no incluye el header `Authorization`

### Requirement: Errores de la API traducidos a mensajes
La UI SHALL leer el `code` de cada respuesta de error `{ code, message }` y mostrar un mensaje en inglés definido para ese código. Un código desconocido, una respuesta sin cuerpo válido o un fallo de red MUST mostrar un mensaje genérico, sin exponer detalles técnicos.

#### Scenario: Código conocido
- **WHEN** la API responde `409` con `{ "code": "EMAIL_ALREADY_EXISTS" }`
- **THEN** la UI muestra "An account with this email already exists"

#### Scenario: Código desconocido o error 500
- **WHEN** la API responde con un código que la UI no conoce o con `500 INTERNAL_ERROR`
- **THEN** la UI muestra "Something went wrong. Please try again"

#### Scenario: Sin conexión con la API
- **WHEN** la solicitud falla por red o la API no responde
- **THEN** la UI muestra "Cannot reach the server. Check your connection and try again"

### Requirement: Errores de validación asociados a los campos
Cuando la API rechaza un formulario con `400 VALIDATION_ERROR`, la UI SHALL mostrar el error en el formulario sin perder lo que el usuario escribió.

#### Scenario: Datos inválidos rechazados por la API
- **WHEN** la API responde `400 VALIDATION_ERROR` al enviar un formulario
- **THEN** el formulario conserva sus valores y muestra el mensaje de error

### Requirement: Sin reintentos automáticos de operaciones que escriben
La UI MUST NOT reintentar automáticamente ninguna solicitud que crea o modifica datos (`POST`); el reintento siempre lo inicia el usuario.

#### Scenario: Falla un POST
- **WHEN** un `POST` responde con error o falla por red
- **THEN** la UI hace una sola solicitud y muestra el error con la opción de volver a intentar
