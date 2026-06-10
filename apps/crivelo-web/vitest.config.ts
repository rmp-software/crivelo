import { defineConfig } from 'vitest/config';

// The 4:6 engine is a pure, framework-agnostic library, so the node
// environment is all it needs (no DOM). Scoped to crivelo-web.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
