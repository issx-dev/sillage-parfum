import { test, expect } from "playwright/test";
import { STATE_PATH, hydrate, trackJsErrors, getJsErrors } from "./helpers";

// Sesión del globalSetup (1 solo login API): este fichero no hace POST
// /api/auth/login para no chocar con el rate limit 5/min por IP.
test.use({ viewport: { width: 1280, height: 800 }, storageState: STATE_PATH });

test.beforeEach(async ({ page }) => trackJsErrors(page));
test.afterEach(async ({ page }, testInfo) => {
  expect(getJsErrors(page), `errores JS en ${testInfo.title}`).toEqual([]);
});

test("admin resumen muestra KPIs y navega SPA a pedidos/stock/productos", async ({ page }) => {
  await page.goto("/admin/resumen", { waitUntil: "domcontentloaded" });
  for (const kpi of ["Ingresos", "Pedidos", "Ticket medio", "Reembolsos"]) {
    await expect(page.getByText(kpi, { exact: true }).first()).toBeVisible({ timeout: 20000 });
  }
  await page.screenshot({ path: "/tmp/shot-resumen.png" });

  // SPA: clicks en sidebar (aside visible a 1280px; evita duplicados del topbar móvil)
  const sidebar = page.locator("aside");
  await hydrate(page, 2000);

  await sidebar.getByRole("link", { name: "Pedidos" }).click();
  await page.waitForURL("**/admin/pedidos", { timeout: 20000, waitUntil: "commit" });
  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: "/tmp/shot-pedidos.png" });

  await sidebar.getByRole("link", { name: "Stock" }).click();
  await page.waitForURL("**/admin/stock", { timeout: 20000, waitUntil: "commit" });
  await expect(page.getByRole("heading", { name: "Stock" })).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: "/tmp/shot-stock.png" });

  await sidebar.getByRole("link", { name: "Productos" }).click();
  await page.waitForURL("**/admin/productos", { timeout: 20000, waitUntil: "commit" });
  await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: "/tmp/shot-productos-admin.png" });
});
