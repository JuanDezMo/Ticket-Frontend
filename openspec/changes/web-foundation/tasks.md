## 1. Proyecto base

- [x] 1.1 Crear el proyecto con Vite (plantilla `react-ts`) y pnpm en la raíz, conservando `openspec/`, `docs/` y `.claude/`. Verificar que `pnpm dev` muestra la página inicial y que `pnpm build` termina sin errores
- [x] 1.2 Activar TypeScript estricto y el alias `@/` → `src/` en `tsconfig` y `vite.config.ts`. Verificar con `pnpm typecheck` y con un import `@/` de prueba
- [x] 1.3 Configurar ESLint (typescript-eslint, react-hooks) y Prettier con los scripts `lint` y `format`. Verificar que `pnpm lint` pasa
- [x] 1.4 Instalar Tailwind CSS e inicializar shadcn/ui en `src/shared/ui`, y agregar `button`, `input`, `label`, `card`, `field` (reemplazo actual de `form` en shadcn) y `sonner`. Verificar que un `Button` se ve con estilos en la página inicial
- [x] 1.5 Agregar `.env.example` con `VITE_API_BASE_URL=/api` y `VITE_API_PROXY_TARGET=http://localhost:3000`, el proxy `/api` en `vite.config.ts` y `src/shared/config/env.ts`. Verificar con `ticket-api` corriendo que `fetch('/api/health')` desde el navegador responde 200
- [x] 1.6 Crear la estructura de carpetas de `docs/architecture.md` (`app/`, `features/auth/`, `shared/{api,session,ui,lib,config}`, `test/`). Verificar que coincide con el documento

## 2. Pruebas y reglas de capas

- [x] 2.1 Configurar Vitest con jsdom, Testing Library, `src/test/setup.ts` y el servidor MSW (`src/test/msw/`), con el script `test`. Verificar con una prueba de humo que pasa con `pnpm test`
- [x] 2.2 Crear `src/test/render.tsx` (providers + router en memoria) y un helper que arma JWT de prueba con `sub`, `role` y `exp`. Verificar con una prueba que renderiza una ruta y decodifica el token
- [x] 2.3 Configurar dependency-cruiser con las reglas del design (decisión 8) y el script `arch`. Verificar que `pnpm arch` pasa y que falla si un componente importa un `api.ts`, probándolo con un import temporal
- [x] 2.4 Agregar el script `check` (`lint`, `typecheck`, `test`, `arch`). Verificar que `pnpm check` pasa completo

## 3. Cliente HTTP y errores (api-client)

- [x] 3.1 Implementar `shared/api/api-error.ts` y `ErrorCode` con los códigos de `ticket-api` más `UNKNOWN` y `NETWORK_ERROR`. Verificar con `pnpm typecheck`
- [x] 3.2 Implementar `shared/api/http-client.ts` (URL base, JSON, token, `ApiError`, `expire()` ante `401` salvo en el login). Verificar con pruebas MSW: con y sin token, error `{ code, message }`, cuerpo inválido, fallo de red y `401`
- [x] 3.3 Implementar `shared/api/error-messages.ts` con `ERROR_MESSAGES` y `getErrorMessage`. Verificar con pruebas de un código conocido, uno desconocido, `NETWORK_ERROR` e `INTERNAL_ERROR`, que deben devolver los textos del spec
- [x] 3.4 Configurar `QueryClient` en `app/providers.tsx` (queries sin reintento ante 4xx y mutations sin reintento) junto con el `Toaster` de sonner. Verificar con una prueba que un `POST` fallido hace una sola solicitud

## 4. Sesión (session-auth)

- [x] 4.1 Implementar `shared/session/session.store.ts` con Zustand y `persist` (`signIn`, `signOut`, `expire`; solo persiste `token` y `email`; rehidratación que valida `exp`). Verificar con pruebas de login, logout, token vencido al rehidratar, token ilegible y que no se guarda la contraseña
- [x] 4.2 Implementar `useSessionExpiry` (temporizador hasta `expiresAt`) y la limpieza de la caché de queries al cerrar o vencer la sesión. Verificar con una prueba con timers falsos: al vencer el token aparece "Your session has expired. Please sign in again"
- [x] 4.3 Implementar `features/auth/schemas.ts`, `types.ts` y `api.ts` (`register`, `login`). Verificar con pruebas de los schemas: email inválido y contraseña de menos de 8 o más de 128 caracteres
- [x] 4.4 Implementar `features/auth/hooks.ts` (`useRegister` y `useLogin`; este último llama a `signIn`). Verificar con pruebas MSW que el login exitoso deja la sesión con el rol del token
- [x] 4.5 Implementar `RegisterForm` y `RegisterPage`: validación en el cliente, `EMAIL_ALREADY_EXISTS` en el campo email y, al terminar, ir al login con el email cargado y el mensaje de éxito. Verificar con pruebas de los escenarios del spec
- [x] 4.6 Implementar `LoginForm` y `LoginPage`: `INVALID_CREDENTIALS` conserva el email y limpia la contraseña, el botón se deshabilita mientras envía y se respeta `redirect` (solo rutas internas). Verificar con pruebas de los escenarios del spec, incluido un `redirect` externo que debe ignorarse
- [x] 4.7 Exponer en `features/auth/index.ts` solo las páginas. Verificar con `pnpm arch`

## 5. Layout y rutas (app-shell)

- [x] 5.1 Implementar `AppLayout` con encabezado, navegación por rol y "Sign out". Verificar con pruebas de las opciones visibles para visitante, USER y ADMIN
- [x] 5.2 Implementar `RequireRole` y `GuestOnly`. Verificar con pruebas: un visitante en `/my-tickets` va al login con `redirect`, un USER en `/admin` ve la página de sin permiso y un usuario con sesión en `/login` va al inicio
- [x] 5.3 Implementar `app/router.tsx` con `/`, `/login`, `/register`, `/my-tickets` (placeholder USER), `/admin` (placeholder ADMIN), `ForbiddenPage`, `NotFoundPage` y un `errorElement` con "Reload". Verificar con pruebas de ruta inexistente y de error de render
- [x] 5.4 Prueba de integración del flujo: un visitante abre `/my-tickets`, inicia sesión como USER y vuelve a `/my-tickets`; al recibir `401` vuelve al login con el mensaje de sesión vencida. Verificar que pasa con `pnpm test`

## 6. Cierre

- [x] 6.1 Escribir el `README.md` en español con requisitos, variables de entorno, scripts y cómo correrlo contra `ticket-api`. Verificar siguiendo el README desde cero
- [ ] 6.2 Verificación manual contra `ticket-api` real: registro, login como USER y como ADMIN (seed), navegación por rol, logout y `401` con un token alterado. Verificar los escenarios de los tres specs y que `pnpm check` pasa
