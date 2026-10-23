# admin-users Specification

## Purpose
Permite a un administrador dar de alta cuentas de usuario con el rol que corresponda, sin depender del registro público, que solo crea usuarios con rol USER.

## Requirements

### Requirement: Formulario de usuario
"/admin/users/new" SHALL ser accesible solo a un ADMIN y pedir email, contraseña y rol (`USER` o `ADMIN`). La UI SHALL validar antes de enviar con las reglas de `ticket-api`: email con formato válido, contraseña de 8 a 128 caracteres y un rol elegido. Los errores SHALL mostrarse junto a cada campo y el envío SHALL ser de una sola solicitud. El botón SHALL mostrar "Creating..." mientras responde.

#### Scenario: Usuario válido
- **WHEN** el ADMIN escribe "boss@mail.com", una contraseña de 8 caracteres o más, elige "Admin" y pulsa "Create user"
- **THEN** la UI envía una sola solicitud con el email, la contraseña y el rol `ADMIN`

#### Scenario: Datos inválidos en el cliente
- **WHEN** el ADMIN envía un email sin formato válido o una contraseña de 7 caracteres
- **THEN** la UI muestra el error junto al campo y no envía nada

#### Scenario: Rol sin elegir
- **WHEN** el ADMIN envía el formulario sin elegir rol
- **THEN** la UI muestra "Choose a role" junto al campo y no envía nada

#### Scenario: Acceso
- **WHEN** un USER o un visitante abre "/admin/users/new"
- **THEN** el USER ve la página de sin permiso y el visitante va al login

### Requirement: Usuario creado
Con una respuesta `201`, la UI SHALL mostrar "User created" con el email y el rol del usuario nuevo y dejar el formulario vacío para crear otro. La contraseña MUST NOT conservarse ni mostrarse después de enviarla.

#### Scenario: Creación exitosa
- **WHEN** la API responde `201` con `boss@mail.com` y rol `ADMIN`
- **THEN** la UI muestra "User created: boss@mail.com (Admin)" y el formulario queda vacío

#### Scenario: Sin persistencia
- **WHEN** el ADMIN crea un usuario y recarga la página
- **THEN** la contraseña no está en `localStorage`, `sessionStorage` ni en la caché de consultas

### Requirement: Errores al crear el usuario
La UI SHALL responder a cada error del servidor así: `409 EMAIL_ALREADY_EXISTS` muestra "An account with this email already exists" junto al campo de email; `400 VALIDATION_ERROR` muestra el mensaje en el formulario; un fallo de red o `500` muestra el mensaje genérico. En todos los casos SHALL conservar el email y el rol escritos y vaciar la contraseña.

#### Scenario: Email repetido
- **WHEN** la API responde `409 EMAIL_ALREADY_EXISTS`
- **THEN** la UI muestra "An account with this email already exists" junto al email y conserva el email y el rol

#### Scenario: Fallo de red
- **WHEN** la solicitud falla por red
- **THEN** la UI muestra el error y deja "Create user" habilitado para reintentar
