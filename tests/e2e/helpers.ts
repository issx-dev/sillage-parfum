import type { Page } from "playwright/test";

export const ADMIN_EMAIL = "admin@sillage.com";
export const ADMIN_PASSWORD = "SillageAdmin#2026";
export const STATE_PATH = "./tests/e2e/.auth/state.json";

// El dev server compila bajo demanda: hay que esperar a hidratación React
// antes de interactuar (si no, el submit cae en GET nativo a /login?).
export async function hydrate(page: Page, ms = 3500) {
  await page.waitForTimeout(ms);
}

export function trackJsErrors(page: Page) {
  const failures: string[] = [];
  page.on("pageerror", (e: Error) => failures.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") failures.push(`console.error: ${m.text()}`);
  });
  (page as unknown as { __failures: string[] }).__failures = failures;
}

export function getJsErrors(page: Page): string[] {
  const failures = (page as unknown as { __failures?: string[] }).__failures ?? [];
  return failures.filter((f) => !f.includes("hydration"));
}
