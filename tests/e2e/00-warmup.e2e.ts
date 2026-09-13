import { test, expect } from "playwright/test";
import { STATE_PATH, hydrate, trackJsErrors, getJsErrors } from "./helpers";

// Se ejecuta primero (00-): pre-compila dev + calienta chunks cliente/servidor
// para que los tests reales no vean ruido de compilación bajo demanda.
test.use({ viewport: { width: 1280, height: 800 }, storageState: STATE_PATH });

test.beforeEach(async ({ page }) => trackJsErrors(page));
test.afterEach(async ({ page }, testInfo) => {
  expect(getJsErrors(page), `errores JS en ${testInfo.title}`).toEqual([]);
});

test("warmup compilacion dev", async ({ page }) => {
  for (const url of ["/", "/productos", "/login", "/admin/resumen"]) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await hydrate(page, 2500);
  }
  // Recarga una vez más: la primera pasada compila, la segunda ya sirve
  // los chunks cliente definitivos.
  for (const url of ["/", "/admin/resumen"]) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await hydrate(page, 2000);
  }
});
