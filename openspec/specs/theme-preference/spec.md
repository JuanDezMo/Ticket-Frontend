# theme-preference Specification

## Purpose
Permite usar la aplicación en tema claro u oscuro, siguiendo el sistema operativo por defecto y recordando la elección del usuario, con contraste accesible en ambos.

## Requirements

### Requirement: Tema por defecto del sistema
Sin una elección guardada, la UI SHALL usar el tema claro u oscuro según la preferencia del sistema operativo (`prefers-color-scheme`), y SHALL cambiar si esa preferencia cambia mientras la página está abierta.

#### Scenario: Sistema en oscuro
- **WHEN** el sistema operativo está en modo oscuro y el usuario no eligió un tema
- **THEN** la UI se muestra en tema oscuro

#### Scenario: El sistema cambia en vivo
- **WHEN** el usuario no eligió un tema y cambia el sistema de claro a oscuro con la página abierta
- **THEN** la UI pasa a tema oscuro sin recargar

### Requirement: Selector de tema
El encabezado SHALL ofrecer un control "Theme" con las opciones "Light", "Dark" y "System", accesible con teclado y con un nombre accesible que indique la opción actual. Elegir "Light" o "Dark" SHALL fijar ese tema; "System" SHALL volver a seguir al sistema.

#### Scenario: Fijar oscuro
- **WHEN** el usuario elige "Dark" con el sistema en claro
- **THEN** la UI pasa a tema oscuro y se mantiene así aunque el sistema siga en claro

#### Scenario: Volver al sistema
- **WHEN** el usuario elige "System"
- **THEN** la UI vuelve a seguir la preferencia del sistema operativo

### Requirement: Elección recordada y sin parpadeo
La elección SHALL guardarse en el navegador y aplicarse antes del primer pintado al volver a abrir la aplicación, sin mostrar el otro tema ni siquiera un instante.

#### Scenario: Recarga con oscuro fijado
- **WHEN** el usuario fijó "Dark" y recarga la página con el sistema en claro
- **THEN** la página aparece directamente en tema oscuro

### Requirement: Todo sigue al tema activo
Todas las superficies, incluidas las notificaciones, los estados del mapa de seats y los controles de formulario, SHALL usar los colores del tema activo, y el texto y los indicadores de foco SHALL cumplir WCAG 2.2 AA en ambos temas (4.5:1 texto normal, 3:1 texto grande, componentes y foco).

#### Scenario: Notificación en oscuro
- **WHEN** aparece una notificación con el tema oscuro activo
- **THEN** la notificación se muestra con los colores del tema oscuro

#### Scenario: Contraste en ambos temas
- **WHEN** se mide el contraste del texto, los bordes de los seats y el foco en tema claro y en oscuro
- **THEN** todos cumplen los mínimos de WCAG 2.2 AA
