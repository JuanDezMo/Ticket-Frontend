# ticket-frontend

UI de la plataforma de tickets. Consume la API de [`ticket-api`](../ticket_backend_api).

- Arquitectura, capas y manejo de estado: [`docs/architecture.md`](docs/architecture.md)
- Endpoints, errores y huecos del backend: [`docs/api-integration.md`](docs/api-integration.md)
- Planeación: `openspec/` (un cambio por iteración)

## Requisitos

- Node 22 o superior
- pnpm 12
- `ticket-api` corriendo para el uso manual (las pruebas no lo necesitan)

## Puesta en marcha

```bash
# 1. Levantar ticket-api (en su repositorio)
cd ../ticket_backend_api && docker compose up -d

# 2. Instalar y arrancar la UI
cd ../ticket_frontend
cp .env.example .env
pnpm install
pnpm dev
```

La UI queda en http://localhost:5173. El usuario ADMIN inicial es el que define el seed de `ticket-api` (`SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en su `.env`).

## Variables de entorno

| Variable                | Por defecto             | Uso                                                                            |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL`     | `/api`                  | Ruta base de las solicitudes a la API                                          |
| `VITE_API_PROXY_TARGET` | `http://localhost:3000` | A dónde redirige el proxy de Vite en desarrollo                                |
| `VITE_CURRENCY`         | `USD`                   | Moneda en la que se muestran los precios (la API envía los montos como número) |

`ticket-api` no tiene CORS. En desarrollo, Vite redirige `/api/*` a la API y quita el prefijo (`/api/events` → `/events`).

## Scripts

| Script           | Qué hace                                   |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | Servidor de desarrollo con el proxy        |
| `pnpm build`     | Revisa los tipos y genera `dist/`          |
| `pnpm preview`   | Sirve el build                             |
| `pnpm test`      | Pruebas (Vitest + Testing Library + MSW)   |
| `pnpm lint`      | ESLint y Prettier                          |
| `pnpm format`    | Aplica Prettier                            |
| `pnpm typecheck` | TypeScript sin emitir                      |
| `pnpm arch`      | Reglas de capas con dependency-cruiser     |
| `pnpm check`     | lint, typecheck, test y arch, en ese orden |

## Agregar una feature

1. Crear `src/features/<feature>/` con `api.ts`, `hooks.ts`, `schemas.ts`, `types.ts`, `components/`, `pages/` e `index.ts`. Si la feature tiene estado del cliente, agregar `store.ts`.
2. `api.ts` solo llama a `http` de `@/shared/api/http-client`.
3. Los componentes usan los hooks, nunca `api.ts`.
4. Exportar las páginas en `index.ts` y registrarlas en `src/app/routes.tsx` con su guarda (`RequireRole` o `GuestOnly`).
5. Correr `pnpm check`.

`src/features/auth` sirve de ejemplo completo.
