import base from "@crivelo/eslint-config";

/**
 * salis ESLint — extends the shared Crivelo base (flat config).
 * Run via `eslint .` (see package.json "lint"); kept flat-config-native so it
 * never triggers `next lint`'s interactive setup prompt.
 */
export default [
  ...base,
  // `.design/` holds the gitignored Salis Claude Design handoff bundle —
  // local-only, never committed, never our code. Keep `eslint .` out of its
  // prototype JSX and `_ds_bundle.js`.
  { ignores: [".next/**", "next-env.d.ts", ".design/**", ".design_system/**"] },
];
