import { test, expect } from "playwright/test";
import { hydrate, trackJsErrors, getJsErrors } from "./helpers";

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => trackJsErrors(page));
test.afterEach(async ({ page }, testInfo) => {
  expect(getJsErrors(page), `errores JS en ${testInfo.title}`).toEqual([]);
});

test("tienda: home, catalogo y ficha de producto", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/sillage/i, { timeout: 20000 });
  await page.screenshot({ path: "/tmp/shot-home.png" });

  await page.goto("/productos", { waitUntil: "domcontentloaded" });
  await hydrate(page, 2000);
  await expect(page.getByRole("heading", { name: /nuestros perfumes/i })).toBeVisible({
    timeout: 20000,
  });
  const firstLink = page.locator('a[href^="/productos/"]').first();
  await expect(firstLink).toBeVisible({ timeout: 15000 });
  const href = await firstLink.getAttribute("href");
  expect(href).toMatch(/^\/productos\/.+/);
  await page.screenshot({ path: "/tmp/shot-productos.png" });

  await page.goto(href!, { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("button", { name: /a(ñ|n)adir.*(cesta|carrito)|comprar/i }).first(),
  ).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: "/tmp/shot-ficha.png" });
});
