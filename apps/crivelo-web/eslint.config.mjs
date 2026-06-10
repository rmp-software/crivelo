import base from "@crivelo/eslint-config";

/**
 * crivelo-web ESLint — extends the shared Crivelo base (flat config).
 * Run via `eslint .` (see package.json "lint"); kept flat-config-native so it
 * never triggers `next lint`'s interactive setup prompt.
 */
export default [
  ...base,
  { ignores: [".next/**", "next-env.d.ts"] },
];
