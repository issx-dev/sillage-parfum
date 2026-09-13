# Axiom learnings — parfum/sillage (append-only, patrones no instancias)

## 2026-09-10 — Auth real + dashboard /admin (SHIP)
- Mock de auth con forma de auth: login que no verifica y register que no persiste
  pasan por "hecho" si nadie lee el código. El gate de seguridad debe exigir
  prueba de DB, no de forma.
- Un fix declarado sin re-medición independiente es humo: el DUMMY_HASH muerto por
  cortocircuito pasó un gate y lo cazó el re-verificador (delta 256ms → 0.9ms).
  Fijar siempre requiere re-test del que duda, nunca del que hizo.
- El coste del dummy debe igualar al real (cost 12): un dummy barato deja 185ms
  de oráculo aunque el código sea correcto.
- Defensa en profundidad en /admin: middleware + pages. Una sola barrera es BLOCK.
- next@15 rompe tipos en /admin (params Promise): migrar es proyecto propio, no
  parte de un ship de auth. Excepción firmada en docs/security-exceptions-auth.md.
- Build con .next stale falla en collect page data: `rm -rf .next` antes de
  declarar build rojo.
- Secreto histórico en git (H6): el código fail-closed no borra el riesgo de
  despliegues viejos. Rotación + decisión de filter-repo pendientes.

## 2026-09-13 — Log real manda, teoría no (22P02)
- Ante un log con error concreto (código Postgres, fichero, línea), el primer
  movimiento es reproducir contra la DB real, no teorizar sobre cachés stale.
  Se perdieron rondas culpando a .next cuando había un bug genuino (ids sin
  sanear en ANY + columna inexistente en el webhook).
- Stale-cache y bug real pueden coexistir: verificar el servidor (líneas del
  log vs código actual) Y perseguir el error a la vez, no en secuencia.
- El subagente con diagnosing-bugs + TDD resolvió en una pasada lo que el
  bucle de hipótesis no avanzó: delegar el diagnóstico con protocolo cuando
  hay error medible.

## 2026-09-13 — Build y dev no comparten .next (E2E en rojo autoinfligido)
- `pnpm build` mientras un `next dev` vive corrompe los chunks del dev
  (`/_next/static/*.js` servidos como text/html): el E2E posterior falla con
  errores JS/MIME que parecen bug de app y no lo son. La skill next-dev-loop
  ya lo prohibía; el orquestador lo violó igual. Regla: gates en serie —
  build SIEMPRE con dev parado o con `distDir` separada, y cualquier E2E en
  rojo tras un build exige `kill + rm -rf .next + restart` antes de culpar
  código.
- Veredicto "4/4 PASS" del builder no es SHIP: la re-ejecución independiente
  encontró el entorno corrupto (esta vez por mi build concurrente). El gate
  de re-verificación con servidor limpio es el que firma.

## 2026-09-13 — numeric de Postgres llega como string (0,00 € en tienda)
- `price numeric` → el driver devuelve `"29.00"` (string), pero
  `VariantRow.price` decía `number` y los `as unknown as` lo silenciaban.
  `applyDiscount` devuelve 0 ante no-finito → ficha, carrito y checkout a
  0,00 €; Stripe y COD lo rechazaban (bien). Solo caían los productos de la
  DB con `numeric`; los del JSON (number) se veían bien — por eso parecía
  intermitente.
- Fix en la frontera (`mapVariantRow`/`mapProductRow` con `Number()` + tipo
  `number | string` + test de regresión). Mismo lote: `saveOrder` usaba
  `WHERE id` en vez de `variant_id` (ningún pedido pagado descontaba stock)
  y `SafeImage` para que ninguna URL pegada por el admin tumbe el render
  (`next-image-unconfigured-host`).
- Tres fuentes de la verdad (main/preview/JSON) sin contrato: sembrar main
  desde el JSON sigue pendiente para cerrar el problema estructural.

## 2026-09-13 — notFound() + loading.tsx = 200 (soft-404 por streaming)
- Si el shell (`loading.tsx`/layout) hace flush con 200 antes de que la
  página resuelva, un `notFound()` posterior solo cambia el BODY, no el
  status. Repro mínima: página con `await sleep(800)` + `loading.tsx` +
  `notFound()` → 200; sin ellos → 404. Verificado en dev y en prod.
- Por eso ni `notFound()` en `generateMetadata` arregla el status: el shell
  ya comprometió las cabeceras. Mitigación aplicada en [slug]: metadata
  `noindex, nofollow` cuando no hay producto (Google no indexa el soft-404)
  + `notFound()` en la página (UI correcta). Quitar el `loading.tsx` daría
  el 404 a cambio de perder el skeleton en todo el grupo — no compensa.
- Regla: rutas con shell de streaming NUNCA prometen status 404; el contrato
  es UI-correcta + noindex.

## 2026-09-13 — Pagos alineados (precio único servidor) + colisión de delegados
- Desalineaciones cerradas: COD no persistía (solo console.log) y confiaba
  precios del cliente → persiste vía `saveOrder` (pending + stock) con
  verificación servidor; cupón SILLAGE2 era un `alert()` falso → catálogo
  server-side (`coupons.ts`) válido en Stripe y COD; Stripe cobraba sin
  descuento → motor único `pricing.ts` (UI = cobrado = verificado);
  webhook rechazaba promotion codes legítimos → tolera vía
  `total_details.amount_discount` firmado por Stripe; reembolso solo log →
  marca `refunded`.
- Dos delegados en paralelo sobre el mismo árbol colisionan: el auditor vio
  "build rojo" a mitad del trabajo del otro. Regla: gates de build/suite
  SIEMPRE en serie y re-medidos por el orquestador (tsc + build + suite
  propios dieron verde: 212 pass / 39 baseline).
