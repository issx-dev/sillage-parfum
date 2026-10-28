# SHIP SPEC — Auth real + Dashboard /admin (SILLAGE)

> Vinculante para `feature/chogan-checkout-auth-migration`. Rol: arquitecto (no implementa).
> Stack: Next.js 14 App Router (justificación ADR-001: sesiones auth con cookies httpOnly + dashboard /admin con datos servidor — necesidad real de servidor, no preferencia).
> Convenciones: TypeScript strict en bordes de módulo; `postgres` pkg (`db.unsafe`, `query`/`transaction` de `src/lib/db.ts`); estilo `docs/database/schema.sql` (`CREATE TABLE IF NOT EXISTS`, índices `IF NOT EXISTS`, RLS service_role).

## Problem Statement

El login firma JWT sin verificar password (`src/app/api/auth/login/route.ts`); el register hashea pero no persiste (`src/app/api/auth/register/route.ts`); no existe tabla `users`; `src/lib/auth.ts` cae a secreto hardcodeado; `src/middleware.ts` no protege nada; `/cuenta` es client-side con `fetch /api/auth/me`; no existe `/admin`. Sin esto no hay cuentas reales ni backoffice.

## Solution

Persistir usuarios en Postgres con bcrypt, contratos auth exactos con cookie `auth_token`, gate de servidor en middleware para `/cuenta` y `/admin/*` con rol, y `/admin` mínimo (pedidos vía `readOrders`, stock, estados) construido con primitivas shadcn propias.

## User Stories

1. Como cliente, quiero registrarme con nombre/email/password y quedar logueado, para comprar sin fricción.
2. Como cliente existente, quiero que registrarme con mi email devuelva 409, para saber que ya tengo cuenta.
3. Como cliente, quiero loguearme solo si mi password coincide (bcrypt), para que mi cuenta esté segura.
4. Como cliente, quiero ver `/cuenta` solo autenticado (si no, redirect a `/login`), para privacidad.
5. Como cliente, quiero cerrar sesión y que la cookie muera, para salir en dispositivos compartidos.
6. Como cliente, quiero que `GET /api/auth/me` me devuelva id/email/name/role, para que la UI pinte según rol.
7. Como admin, quiero entrar a `/admin` solo con `role=admin` (si no, redirect), para proteger el backoffice.
8. Como admin, quiero ver pedidos (de `readOrders`) con email/total/estado/fecha, para operar ventas.
9. Como admin, quiero ver stock por variante y cambiar estado paid/refunded/failed, para gestionar inventario y reembolsos.
10. Como operador, quiero que el secreto JWT venga solo de env (sin fallback), para no firmarlo con clave pública.

## Implementation Decisions

### D1. Migración `users` (nuevo bloque en `docs/database/schema.sql`, mismo estilo)

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage users"
  ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
```

Reglas: `email` se guarda normalizado (`lower(trim())`, UNIQUE); `password_hash` bcrypt cost 12 (`hashPassword` existente); `role` default `customer`; `updated_at` se toca en cada UPDATE de perfil/password. Acceso solo vía `query`/`transaction` (`db.unsafe`, `prepare:false` compatible Supabase pooler). Seed de admin: un único `UPDATE users SET role='admin' WHERE email=...` manual documentado — fuera de scope automatizar.

### D2. `src/lib/auth.ts` — muerte del fallback

- `JWT_SECRET`: requerido desde `JWT_SECRET` (añadir a `envSchema` en `src/lib/env.ts` como `z.string().min(32)`); si falta, lanzar en import — PROHIBIDO el literal `sillage_parfum_jwt_secure_secret_key_2026_chogan`.
- `UserPayload` pasa a `{ id, email, name, role: 'customer' | 'admin' }`; `signToken`/`verifyToken` propagan `role` (tokens viejos sin `role` → `verifyToken` devuelve `role:'customer'`).

### D3. Contratos API exactos (cookie `auth_token`: `httpOnly`, `secure=prod`, `sameSite:lax`, `maxAge=24h` — H7 decisión CTO, JWT y cookie 24h, no 7d)

- `POST /api/auth/register` `{name≥2, email, password≥8 + denylist}` (zod, 400 si inválido) → `SELECT id FROM users WHERE email=lower` → si existe **200 `{success:true}` genérico SIN cookie (H3 anti-enumeración)** → si no, `hashPassword` + `INSERT ... RETURNING id,email,name,role` + `signToken` + cookie + **201 `{user:{id,email,name,role}}`**. Nunca devolver hash.
- `POST /api/auth/login` `{email, password}` (400 si inválido) → `SELECT` por email normalizado → bcrypt SIEMPRE (hash real o dummy si no existe, H2 anti-timing) → si no existe o password mal → **401 `{error:"invalid_credentials"}`** (mismo mensaje ambos casos) → si ok, `signToken` + cookie + **200 `{user:{id,email,name,role}}`**.
- `POST /api/auth/logout` (NUEVO; el `POST /api/auth/me` actual queda deprecated pero se mantiene 1 release) → borra cookie (`expires:new Date(0)`, mismos atributos que el set: `httpOnly`, `secure=prod`, `sameSite:lax`, `path:/` — H12) + 200 `{success:true}`.
- `GET /api/auth/me` → cookie `auth_token` ausente/inválida → **401 `{user:null}`** → válida → **200 `{user:{id,email,name,role}}`** (rol leído del JWT; si se necesita frescura post-cambio-de-rol, revalidar contra DB — decisión: JWT basta salvo cambio de rol, documentado).

### D4. Middleware servidor (`src/middleware.ts`) — matcher + gate

```ts
export const config = {
  matcher: ["/cuenta/:path*", "/admin/:path*", "/api/stripe/:path*", "/api/search", "/((?!_next/static|_next/image|favicon.svg).*)"],
};
```

Gate ANTES del CSP/rate-limit existente: leer cookie `auth_token`, `verifyToken` (jose corre en Edge). Sin token/inválido en `/cuenta/*` o `/admin/*` → `NextResponse.redirect(/login?next=<pathname>)`. Token válido con `role!=='admin'` en `/admin/*` → redirect `/cuenta?forbidden=1`. `/cuenta/page.tsx` pasa a Server Component que lee la cookie (o mantiene fetch a `me` como progresivo — el gate real es el middleware, no el `useEffect`).

### D5. Mapa `/admin` (datos de `readOrders`; sin llamadas Stripe en vivo)

- `/admin` → redirect a `/admin/pedidos`.
- `/admin/pedidos` (Server Component): tabla de `readOrders()` — columnas id/email/total/estado/fecha; filtro por estado + búsqueda por email (params URL). Fila → `/admin/pedidos/[id]`.
- `/admin/pedidos/[id]`: detalle (items, totales, `stripe_session_id`) + acción cambio estado paid/refunded/failed (`UPDATE orders SET payment_status` vía Server Action, solo admin, revalidate path).
- `/admin/stock`: tabla variantes (de `products`+`variants` existentes) con stock bajo destacado; edición de stock vía Server Action (`UPDATE variants SET stock`).
- Layout `/admin/layout.tsx`: shell servidor con nav (Pedidos/Stock) + email del admin; `generateMetadata` `robots:noindex`.

### D6. Decisión componentes (evaluados 2026-09-09)

- **shadcnblocks** (18 dashboard blocks + 14 app-shell, shadcnblocks.com): solo **referencia copy-paste** de patrones tabla/shell. El Admin Kit (139 págs, Next 16 + Tailwind 4, $129+) se RECHAZA: stack incompatible con este repo (Next 14 + Tailwind 3) y sobredimensionado.
- **Open-source `shadcndashboard/next-shadcn-dashboard`** (MIT, Next.js App Router + shadcn/ui + Tailwind): solo **referencia** de layout sidebar+header. Se RECHAZA importación completa: Tailwind v4 vs v3 del repo + arrastre de apps (blog/notes/tickets) ajenas.
- **DECISIÓN: construir con primitivas shadcn propias** (coherente con `Button/Sheet/Skeleton` ya existentes, sin `components.json` aún). Instalación concreta:
  ```
  pnpm dlx shadcn@latest init -d app -s -b neutral -c src/components/ui --no-rovo
  pnpm dlx shadcn@latest add card table badge dialog dropdown-menu skeleton separator input select
  ```
  + `TanStack Table` solo si la tabla de pedidos supera filtro/orden básicos (vía `pnpm add @tanstack/react-table`; si no, tabla server-render simple). Estilo: tokens `gold/cream` existentes, sin dark-mode nuevo.

## Testing Decisions

- Qué es buen test aquí: comportamiento externo (status + cookie + redirect), nunca detalles (salt, nonce, SQL literal).
- Costuras (una por área, la más alta posible): `POST register/login` (supertest-style contra route handlers con DB de test o `db` mockeado a nivel `query`), `GET me` (401/200+role), `middleware` (redirects /cuenta·/admin·rol), `readOrders` ya cubierto en `src/lib/data/orders.test.ts` (reusar, no duplicar).
- Prior art: `orders.test.ts`, `webhook.test.ts` (patrón idempotencia/transacción). Casos nuevos: register 409 duplicado; login 401 password mal / usuario inexistente (mismo mensaje); logout borra cookie; `me` devuelve role; middleware: anónimo→/login, customer→/admin redirigido, admin→pasa.
- Deuda conocida: 39 tests en rojo preexistentes (localStorage/jsdom) — NO bloquear este ship; solo no aumentar el conteo. E2E (playwright, ya en devDeps) para `/admin/pedidos` queda como follow-up, no gate.

## Out of Scope

OAuth/social login; reset-password email; cambio de rol desde UI; paginación cursor en pedidos (orden `created_at DESC` basta); RLS por usuario (todo vía service_role servidor); E2E playwright gate; seed automático de admin; migración de los 39 rojos.

## Further Notes

- Orden de tickets: ① migración users + muerte fallback (`env.JWT_SECRET`) → ② contratos register/login/logout/me → ③ middleware gate → ④ /admin pedidos+stock → ⑤ tests plan.
- `POST /api/auth/me` (logout legacy de `/cuenta`) se retira cuando el cliente llame a `/api/auth/logout`.
- Verificación de cierre: `tsc --noEmit` + `next build` verdes; spec sin secretos (el literal viejo no debe aparecer en ningún fichero salvo este doc histórico).
