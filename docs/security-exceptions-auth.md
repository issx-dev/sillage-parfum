# Excepciones de seguridad — scope AUTH (`feature/chogan-checkout-auth-migration`)

Fecha: 2026-09-09. Responsable: builder AUTH.

## H5 — `pnpm audit` (high/critical)

- **form-data: CORREGIDO.** `jsdom 24.1.3 → ^30.0.1` (único consumidor de
  `form-data` en el árbol, solo dev/test). Re-audit: 0 avisos high/critical
  para `form-data`. Build OK, tests sin regresiones (los 39 fallos del repo
  son preexistentes en la rama, verificados contra el baseline con
  `git stash` + `jsdom@24.1.3`: mismo conteo 39/139).
- **next 14.2.35: EXCEPCIÓN DOCUMENTADA (revertido).** Se intentó
  `next@15 + eslint-config-next@15`: el audit limpiaba todos los avisos de
  `next`, pero `pnpm build` rompe con
  `Type error: ... 'params' ... missing ... Promise` en
  `src/app/admin/pedidos/[id]/page.tsx` (Next 15 exige `params` asíncronos).
  Ese fichero es scope /admin+orders (prohibido tocar) → revertido a
  `next@14.2.35` según la propia regla H5 ("si rompe build, revertir y
  documentar"). Mitigación vigente: el middleware ya limita `/api/auth/`
  a 5/min, CSP con nonce, y `poweredByHeader: false` no anuncia versión.
  Acción pendiente (fuera de este scope): migración Next 15+ propia que
  incluya /admin.
- **Resto high (transitivos/dev, fuera del alcance "next y form-data"): EXCEPCIÓN.**
  `vitest/vite`, `sharp`, `postcss`, `glob`, `js-yaml`, `nanoid`,
  `brace-expansion`, `browserslist` — llegan vía cadenas dev
  (`eslint-config-next`, `vitest`, `tailwindcss`) o build-time (`sharp`);
  ninguno es alcanzable en runtime de producción. Subirlos exige majors
  (vitest 1→3) fuera del scope dictado. Re-evaluar en la migración Next 15.

## H7 — JWT 24h (decisión CTO, documentada)

`signToken` expira en `24h` (antes `7d`); cookies `auth_token` de login y
register con `maxAge: 86400`. Justificación: ventana de abuso de un token
robado limitada a un día; el usuario re-autentica al expirar. Sin refresh
tokens en este scope. Tests: `H7 signToken lifetime` (exp−iat = 86400) y
`Max-Age=86400` en Set-Cookie de login/register.
