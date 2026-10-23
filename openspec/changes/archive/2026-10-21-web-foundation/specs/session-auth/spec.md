## Purpose

Permite crear una cuenta, iniciar y cerrar sesión, y mantener en la UI la identidad y el rol del usuario mientras su token sea válido.

## ADDED Requirements

### Requirement: Registro de cuenta
La UI SHALL ofrecer un formulario de registro con email y contraseña que valide antes de enviar: email con formato válido y contraseña de 8 a 128 caracteres. El registro MUST NOT enviar un rol. Al registrarse, la UI SHALL llevar al login con el email ya escrito y un mensaje de éxito.

#### Scenario: Registro exitoso
- **WHEN** un visitante envía un email válido y una contraseña de 8 o más caracteres
- **THEN** la cuenta se crea, la UI muestra "Account created. Please sign in" y abre el login con el email ya cargado

#### Scenario: Datos inválidos en el cliente
- **WHEN** el visitante escribe un email sin formato válido o una contraseña de menos de 8 caracteres
- **THEN** la UI muestra el error junto al campo y no envía la solicitud

#### Scenario: Email ya registrado
- **WHEN** la API responde `409 EMAIL_ALREADY_EXISTS`
- **THEN** la UI muestra "An account with this email already exists" junto al campo email

### Requirement: Inicio de sesión
La UI SHALL ofrecer un formulario de login con email y contraseña. Con credenciales válidas SHALL abrir la sesión con el `userId` (`sub`), el rol y la fecha de expiración tomados del token, y llevar al usuario a la página que intentaba abrir o, si no había ninguna, al inicio.

#### Scenario: Login exitoso
- **WHEN** el usuario envía credenciales válidas
- **THEN** la sesión queda abierta con su rol y la UI lo lleva a la página que intentaba abrir, o al inicio

#### Scenario: Credenciales inválidas
- **WHEN** la API responde `401 INVALID_CREDENTIALS`
- **THEN** la UI muestra "Invalid email or password", conserva el email y limpia la contraseña

#### Scenario: Envío en curso
- **WHEN** el usuario envía el formulario y la respuesta no ha llegado
- **THEN** el botón queda deshabilitado y muestra que está procesando, sin permitir un segundo envío

#### Scenario: Usuario con sesión abre el login
- **WHEN** un usuario con sesión activa abre la página de login o de registro
- **THEN** la UI lo lleva al inicio

### Requirement: Sesión persistente
La UI SHALL conservar la sesión al recargar o cerrar y volver a abrir el navegador mientras el token no haya expirado. Una sesión con token vencido o ilegible MUST descartarse al iniciar la UI.

#### Scenario: Recarga con token vigente
- **WHEN** el usuario recarga la página y su token no ha vencido
- **THEN** la sesión sigue abierta con el mismo rol

#### Scenario: Token vencido al abrir la UI
- **WHEN** la UI inicia con un token vencido o con formato inválido
- **THEN** la sesión se descarta y el usuario aparece como visitante

### Requirement: Cierre de sesión
La UI SHALL permitir cerrar la sesión en cualquier momento; al cerrarla SHALL borrar el token y los datos de la sesión guardados en el navegador, y llevar al usuario al login.

#### Scenario: Logout manual
- **WHEN** el usuario elige "Sign out"
- **THEN** la sesión se borra y la UI muestra el login

### Requirement: Expiración de la sesión
Cuando el token vence durante el uso o la API responde `401 UNAUTHORIZED`, la UI SHALL cerrar la sesión, mostrar "Your session has expired. Please sign in again" y llevar al login recordando la página en la que estaba.

#### Scenario: La API rechaza el token
- **WHEN** una solicitud autenticada responde `401 UNAUTHORIZED`
- **THEN** la sesión se cierra, aparece el mensaje de sesión vencida y se abre el login

#### Scenario: Volver tras iniciar sesión otra vez
- **WHEN** el usuario vuelve a iniciar sesión después de que su sesión expiró
- **THEN** la UI lo lleva a la página en la que estaba

### Requirement: Datos sensibles fuera del navegador
La UI MUST NOT guardar la contraseña en el navegador ni escribirla en logs; solo guarda el token y los datos derivados de él.

#### Scenario: Revisión del almacenamiento
- **WHEN** se revisa el almacenamiento del navegador después de un login
- **THEN** no aparece la contraseña, solo el token y los datos de la sesión
