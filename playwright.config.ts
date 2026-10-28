import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  globalSetup: "./tests/e2e/auth.setup.ts",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3101",
  },
  timeout: 60000,
});
