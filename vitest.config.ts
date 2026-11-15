import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Kept apart from vite.config.ts so the production build never loads test tooling.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
  },
});
