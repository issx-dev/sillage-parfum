import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      // Stub Next.js' "server-only" guard for unit tests.
      // The real package throws when imported outside a Next server runtime.
      "server-only": resolve(__dirname, "./test/shims/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "app/**/*.{test,spec}.{ts,tsx}",
      "components/**/*.{test,spec}.{ts,tsx}",
      "lib/**/*.{test,spec}.{ts,tsx}",
      "store/**/*.{test,spec}.{ts,tsx}",
      "hooks/**/*.{test,spec}.{ts,tsx}",
      "*.{test,spec}.{ts,tsx}",
    ],
  },
});
