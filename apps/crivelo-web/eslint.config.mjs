import base from "@crivelo/eslint-config";

/**
 * crivelo-web ESLint — extends the shared Crivelo base (flat config).
 * Run via `eslint .` (see package.json "lint"); kept flat-config-native so it
 * never triggers `next lint`'s interactive setup prompt.
 */
export default [
  ...base,
  // `.design/` (and `.design_system/`) hold the gitignored Claude Design handoff
  // bundle — local-only, never committed, never our code. Keep `eslint .` from
  // scanning the throwaway prototype/`_ds_bundle.js` inside it.
  { ignores: [".next/**", "next-env.d.ts", ".design/**", ".design_system/**"] },
];
