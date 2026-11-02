import { defineConfig } from "vitest/config";

// The dosing engine is a pure, framework-agnostic module — no DOM, no I/O — so
// the node environment is all it needs. Phase 1 of the build order is this
// engine and its tests, with no UI at all.
export default defineConfig({
  test: {
    environment: "node",
    include: ["engine/**/*.test.ts"],
  },
});
