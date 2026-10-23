# app-shell Specification

## Purpose
Define el marco común de la UI: layout, navegación según el rol del usuario, control de acceso a las rutas y páginas para errores de navegación.

## Requirements

### Requirement: Layout común
La UI SHALL mostrar en todas las páginas un encabezado con el nombre de la aplicación ("Tickets"), que lleva al inicio, y un área de contenido. Los mensajes de éxito y error se muestran como notificaciones breves.

#### Scenario: Navegación al inicio
- **WHEN** el usuario hace clic en el nombre de la aplicación
- **THEN** la UI abre la página de inicio

### Requirement: Navegación según el rol
El encabezado SHALL mostrar solo las opciones que corresponden al rol actual:

| Rol | Opciones |
|---|---|
| Visitante | "Events", "Sign in", "Sign up" |
| USER | "Events", "My tickets", "Sign out" |
| ADMIN | "Events", "Admin", "Sign out" |

Las opciones de las iteraciones siguientes pueden llevar a páginas placeholder mientras no existan.

#### Scenario: Visitante
- **WHEN** no hay sesión
- **THEN** el encabezado muestra "Events", "Sign in" y "Sign up"

#### Scenario: USER
- **WHEN** hay una sesión con rol USER
- **THEN** el encabezado muestra "Events", "My tickets" y "Sign out", y no muestra "Admin"

#### Scenario: ADMIN
- **WHEN** hay una sesión con rol ADMIN
- **THEN** el encabezado muestra "Events", "Admin" y "Sign out", y no muestra "My tickets"

### Requirement: Rutas protegidas por rol
Cada ruta SHALL declarar su acceso: pública, solo con sesión, solo USER o solo ADMIN. Un visitante que abre una ruta con sesión requerida SHALL ir al login, que recuerda la ruta original. Un usuario con sesión pero sin el rol requerido SHALL ver la página de sin permiso.

#### Scenario: Visitante en ruta protegida
- **WHEN** un visitante abre "/my-tickets"
- **THEN** la UI abre el login y, tras iniciar sesión como USER, lo lleva a "/my-tickets"

#### Scenario: Rol sin permiso
- **WHEN** un USER abre "/admin"
- **THEN** la UI muestra "You do not have permission to view this page" con un enlace al inicio

#### Scenario: Rol con permiso
- **WHEN** un ADMIN abre "/admin"
- **THEN** la UI muestra la página de admin

### Requirement: Página no encontrada
La UI SHALL mostrar una página "Page not found" con un enlace al inicio para cualquier ruta que no exista.

#### Scenario: Ruta inexistente
- **WHEN** el usuario abre una ruta que no existe
- **THEN** la UI muestra "Page not found" y un enlace al inicio

### Requirement: Error inesperado de la interfaz
Si una página falla al renderizar, la UI SHALL mostrar "Something went wrong" con una opción para recargar, sin dejar la pantalla en blanco.

#### Scenario: Falla al renderizar
- **WHEN** ocurre un error inesperado al mostrar una página
- **THEN** la UI muestra "Something went wrong" y un botón "Reload"
