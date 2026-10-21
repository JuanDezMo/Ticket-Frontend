# ticket-frontend – Arquitectura

## 1. Visión general

```
Browser (React) --/api (proxy)--> ticket-api --> payment-gateway
```

En desarrollo, Vite hace de proxy de `/api` hacia `ticket-api` (`http://localhost:3000`), porque la API no tiene CORS. En Docker, nginx sirve la app y hace el mismo proxy.

## 2. Stack

| Tema                | Elección                                               |
| ------------------- | ------------------------------------------------------ |
| Base                | React, TypeScript (estricto), Vite, pnpm               |
| Rutas               | React Router                                           |
| Estado del servidor | TanStack Query                                         |
| Estado del cliente  | Zustand                                                |
| Formularios         | react-hook-form + zod                                  |
| UI                  | Tailwind CSS + shadcn/ui (Radix), lucide-react, sonner |
| Utilidades          | date-fns, jwt-decode, fetch nativo                     |
| Pruebas             | Vitest, Testing Library, MSW, Playwright               |
| Calidad             | ESLint, Prettier, dependency-cruiser                   |

## 3. Estructura de carpetas

```
src/
├── app/                    # Arranque
│   ├── App.tsx
│   ├── router.tsx          # Todas las rutas
│   └── providers.tsx       # QueryClient, toasts
├── features/
│   ├── auth/
│   │   ├── api.ts          # Solo llamadas HTTP
│   │   ├── hooks.ts        # useLogin, useRegister (TanStack Query)
│   │   ├── store.ts        # Solo si la feature tiene estado de cliente
│   │   ├── schemas.ts      # zod: formularios y respuestas
│   │   ├── types.ts
│   │   ├── components/     # LoginForm.tsx + LoginForm.test.tsx
│   │   ├── pages/          # LoginPage.tsx, RegisterPage.tsx
│   │   └── index.ts        # API pública de la feature
│   ├── events/             # Listado y filtros
│   ├── seats/              # Mapa de seats
│   ├── reservations/       # Reserva en curso y cuenta regresiva
│   ├── tickets/            # Checkout y mis tickets
│   └── admin/              # Crear evento, cancelar, crear usuarios
├── shared/
│   ├── api/                # http-client.ts, api-error.ts, error-messages.ts
│   ├── session/            # session.store.ts (Zustand), RequireRole.tsx
│   ├── ui/                 # Componentes de shadcn/ui
│   ├── lib/                # format-date.ts, format-money.ts
│   └── config/             # env.ts
└── test/                   # setup.ts, msw/handlers.ts
e2e/                        # Playwright
```

## 4. Capas y dependencias

```
page -> component -> hook -> api   -> shared/api/http-client -> ticket-api
                          \-> store (Zustand)
```

| Capa          | Equivalente en ticket-api | Responsabilidad                                    |
| ------------- | ------------------------- | -------------------------------------------------- |
| `pages/`      | controller                | Une componentes y lee parámetros de la ruta        |
| `components/` | vista                     | Solo renderiza; recibe datos y callbacks por props |
| `hooks.ts`    | service                   | Estado del servidor, caché, invalidaciones, carga  |
| `api.ts`      | repository                | Solo `fetch`, sin lógica                           |
| `store.ts`    | —                         | Estado del cliente (Zustand)                       |

Reglas (las verifica dependency-cruiser):

- Una feature solo importa de otra por su `index.ts`.
- `shared/` nunca importa de `features/`.
- Un componente nunca llama a `api.ts` ni a `fetch`.

## 5. Manejo de estado

| Tipo de estado            | Dónde vive             | Ejemplos                                                 |
| ------------------------- | ---------------------- | -------------------------------------------------------- |
| Datos del servidor        | TanStack Query         | eventos, seats, mis tickets                              |
| Estado global del cliente | Zustand                | sesión (token, rol), reserva en curso, seat seleccionado |
| Estado local              | `useState`             | campo abierto, diálogo visible                           |
| Estado de la URL          | parámetros de búsqueda | filtros y página del listado                             |
| Formularios               | react-hook-form        | login, checkout, crear evento                            |

Reglas:

- Los datos del servidor **nunca** se copian a Zustand; si vienen de la API, viven en TanStack Query.
- Cada store es pequeño y tiene un solo propósito (`session.store.ts`, `reservations/store.ts`).
- Los componentes leen con selectores (`useSessionStore((s) => s.role)`) para no re-renderizar de más.
- Las acciones viven dentro del store (`login`, `logout`, `setReservation`, `clearReservation`).
- `persist` solo donde se justifica: sesión en `localStorage` y reserva en curso en `sessionStorage` (mitiga el hueco 3 de `docs/api-integration.md`). Nunca datos de tarjeta.

## 6. SOLID aplicado

| Principio | Aplicación                                                                              | Ejemplo                                                                            |
| --------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| S         | Cada archivo hace una cosa: HTTP, estado del servidor, estado del cliente o render      | `api.ts` no sabe de React                                                          |
| O         | Tablas en lugar de `if/else`                                                            | `ERROR_MESSAGES: Record<ErrorCode, …>`, `SEAT_STATUS_STYLE: Record<SeatStatus, …>` |
| L         | Componentes base extienden las props nativas                                            | `Button` acepta todo lo de `<button>`                                              |
| I         | Props pequeñas                                                                          | `SeatButton({ seat, onSelect })`                                                   |
| D         | Componente depende del hook, el hook de `api.ts`/`store.ts`, `api.ts` del `http-client` | En pruebas, MSW reemplaza la red; no se mockean módulos                            |

Fuera a propósito: clases, contenedor de inyección y abstracciones sin un segundo uso.

## 7. Convenciones

- Código, nombres, tests y textos de la UI en inglés; documentos y comentarios necesarios en español.
- Constantes para estados, roles y códigos de error, nunca strings sueltos.
- Prueba junto al archivo (`X.tsx` + `X.test.tsx`).
- Componentes de máximo ~150 líneas; si crecen, se dividen.
- Comentarios solo para explicar un porqué.
