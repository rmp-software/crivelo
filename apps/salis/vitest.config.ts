import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The dosing engine is a pure, framework-agnostic module — no DOM, no I/O — so
// the node environment is all it needs. `app/` is included for the device store:
// it touches two browser APIs, `window.localStorage` and the `storage` event,
// which its tests stub in memory — cheaper and more honest than pulling jsdom in
// to exercise a handful of methods.
// The `@/*` alias is mirrored from tsconfig because `app/` imports the content
// JSON through it, the way Next does.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["engine/**/*.test.ts", "app/**/*.test.ts"],
  },
});
