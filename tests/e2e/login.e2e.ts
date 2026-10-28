import { test, expect } from "playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, hydrate, trackJsErrors, getJsErrors } from "./helpers";

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => trackJsErrors(page));
test.afterEach(async ({ page }, testInfo) => {
  expect(getJsErrors(page), `errores JS en ${testInfo.title}`).toEqual([]);
});

test("login real con formulario redirige a /cuenta", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await hydrate(page);
  await page.fill("#login-email", ADMIN_EMAIL);
  await page.fill("#login-password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/cuenta", { timeout: 20000, waitUntil: "commit" });
  await expect(page.getByText(ADMIN_EMAIL).first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: "/tmp/shot-cuenta.png" });
});
