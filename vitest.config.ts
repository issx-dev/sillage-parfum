import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
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
      "src/app/**/*.{test,spec}.{ts,tsx}",
      "src/components/**/*.{test,spec}.{ts,tsx}",
      "src/lib/**/*.{test,spec}.{ts,tsx}",
      "src/store/**/*.{test,spec}.{ts,tsx}",
      "src/hooks/**/*.{test,spec}.{ts,tsx}",
      "src/*.{test,spec}.{ts,tsx}",
    ],
  },
});
