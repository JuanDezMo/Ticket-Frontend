## Context

Repositorio vacío salvo OpenSpec y `docs/`. La estructura, las capas y el manejo de estado ya están definidos en `docs/architecture.md`; los endpoints y la tabla de errores, en `docs/api-integration.md`. Restricciones de `ticket-api` que condicionan el diseño:

- No tiene CORS (hueco 1).
- `POST /auth/login` devuelve `{ accessToken, tokenType, expiresIn }`. El JWT trae `sub`, `role`, `iat` y `exp`, pero no el email (hueco 4).
- No hay refresh token: la sesión dura lo que dura el token (por defecto 3600 s).

## Goals / Non-Goals

**Goals:**
- Dejar listo el patrón que copian las features siguientes (`api.ts` → `hooks.ts` → `components` → `pages`), con `auth` como ejemplo completo.
- Que las reglas de capas fallen en CI y no dependan de revisión manual.

**Non-Goals:**
- Tema visual definitivo: se usan los estilos por defecto de shadcn/ui y se pulen en `web-hardening`.
- Code splitting por ruta: se agrega cuando el bundle lo justifique.

## Decisions

### 1. Proxy de Vite para `/api`
`vite.config.ts` redirige `/api/*` a `VITE_API_PROXY_TARGET` (por defecto `http://localhost:3000`) y quita el prefijo. El cliente usa `VITE_API_BASE_URL` (por defecto `/api`).
- *Alternativa:* agregar CORS en `ticket-api`. Se descarta en esta iteración para no tocar el backend; en producción nginx hará el mismo proxy (iteración 5).

### 2. Cliente HTTP propio sobre `fetch`
`shared/api/http-client.ts` expone `http.get/post<T>(path, { body, query })`. Hace cuatro cosas:
1. Arma la URL con la base.
2. Agrega el token que lee de `useSessionStore.getState()`.
3. Serializa el cuerpo a JSON.
4. En cualquier respuesta que no sea 2xx lanza `ApiError { status, code, message }`. Si no hay un cuerpo válido, usa el código `UNKNOWN`; si falla la red, `NETWORK_ERROR`.

Ante un `401` (salvo en `/auth/login`, donde significa credenciales inválidas) llama a `useSessionStore.getState().expire()`.
- `ApiError` es la única clase del proyecto: se justifica porque extiende `Error` y conserva el stack. No es un patrón a imitar.
- *Alternativa:* axios o ky. Se descartan porque `fetch` cubre lo necesario y el backend sigue el mismo criterio.

### 3. Mensajes de error por tabla
`shared/api/error-messages.ts` define `ERROR_MESSAGES: Record<ErrorCode, string>` (mensajes en inglés) y `getErrorMessage(error)` con el genérico como respaldo. `ErrorCode` copia los códigos de `ticket-api` como constantes `as const`. Cada formulario decide a qué campo va un código con su propia tabla pequeña (por ejemplo, `EMAIL_ALREADY_EXISTS → email`).
- *Alternativa:* usar el `message` de la API tal cual. Se descarta porque un mensaje de API no siempre sirve para el usuario final y la tabla deja cada caso explícito.

### 4. Sesión en Zustand con `persist`
`shared/session/session.store.ts`:
- Estado: `{ token, userId, role, email, expiresAt, expired }`.
- Acciones: `signIn(token, email)`, `signOut()`, `expire()`.

`signIn` decodifica el JWT con jwt-decode. El email se guarda desde el formulario, porque el token no lo trae y el encabezado lo muestra.

`persist` usa `localStorage` y solo guarda `token` y `email`. Al rehidratar, el store vuelve a derivar los datos del token y descarta la sesión si está vencida o no se puede leer.

Un hook `useSessionExpiry()` en `app/` programa un `setTimeout` hasta `expiresAt` que llama a `expire()`.

Los componentes leen siempre con selectores (`useSessionStore((s) => s.role)`).
- *Alternativa:* Context de React. Se descarta porque el usuario eligió Zustand: además, se puede leer fuera de React (lo usa el cliente HTTP) y evita re-renders.
- *Alternativa:* guardar `role` en `localStorage`. Se descarta porque el rol siempre sale del token, así no hay dos fuentes de verdad.

### 5. TanStack Query solo para datos del servidor
`QueryClient` en `app/providers.tsx`:
- Las queries reintentan una vez, pero no ante errores 4xx.
- Las mutations no reintentan (requisito de no reintentar `POST`).
- `signOut` y `expire` limpian la caché (`queryClient.clear()`), registrado en `providers.tsx`.

Login y registro son mutations en `features/auth/hooks.ts`.

### 6. Rutas y guardas
- `app/router.tsx` usa `createBrowserRouter` con un layout raíz (`AppLayout`) y un `errorElement` para los errores de render.
- `shared/session/RequireRole.tsx` recibe `roles?: Role[]`:
  - sin sesión, redirige a `/login?redirect=<ruta>`;
  - con sesión pero sin el rol, muestra `ForbiddenPage`.
- `GuestOnly` envuelve `/login` y `/register`.
- Rutas de esta iteración: `/`, `/login`, `/register`, `/my-tickets` (USER, placeholder) y `/admin` (ADMIN, placeholder). Cualquier otra ruta muestra `*` → `NotFoundPage`.
- `redirect` solo acepta rutas internas que empiecen con `/`, para evitar open redirects.

### 7. Formularios
react-hook-form con `zodResolver`. Los schemas viven en `features/auth/schemas.ts` y repiten las reglas de la API: email válido y contraseña de 8 a 128 caracteres, aunque en el login solo se exige que no esté vacía, como hace la API.

### 8. Pruebas y calidad
- **Pruebas:**
  - Vitest con jsdom y Testing Library.
  - MSW (`msw/node`) con handlers por defecto en `src/test/msw/handlers.ts`, y `server.use(...)` dentro de cada prueba para los casos de error.
  - `src/test/render.tsx` monta los providers y un router en memoria.
  - Para el JWT de prueba, un helper arma un token sin firma válida, que alcanza porque el cliente solo lo decodifica.
- **Reglas de capas:** dependency-cruiser con estas reglas:
  - `shared` no importa de `features`;
  - una feature importa de otra solo por `index.ts`;
  - `components` y `pages` no importan `api.ts`;
  - `api.ts` no importa React.
- **Scripts:** `dev`, `build`, `preview`, `test`, `lint` (eslint + prettier --check), `typecheck`, `arch` y `check` (todos los anteriores en orden).
- **Alias:** `@/` → `src/`.

## Risks / Trade-offs

- [Token en `localStorage` expuesto a XSS] → React escapa el contenido por defecto y no se usa `dangerouslySetInnerHTML`. Una cookie `httpOnly` requeriría cambiar el backend, y queda documentado como mejora.
- [La sesión vence a mitad de un formulario sin aviso previo] → se acepta en el MVP. Al vencer, se recuerda la ruta y el usuario vuelve a ella; no hay refresh token.
- [El rol del token puede quedar desactualizado si un ADMIN cambia roles] → el backend no permite cambiar roles en el MVP, y la API valida el rol en cada solicitud de todos modos.
- [Los códigos de error se duplican respecto al backend] → la tabla está en un solo archivo y cualquier código desconocido usa el mensaje genérico, así que un código nuevo en la API no rompe la UI.

## Migration Plan

No aplica: es un proyecto nuevo. Para correrlo: `ticket-api` con `docker compose up` y luego `pnpm dev` en este repo.
