import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Base flat ESLint config shared across Crivelo packages.
 * Apps that need framework-specific rules (e.g. Next.js) layer those on top
 * of this base in their own eslint.config.js.
 */
export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
);
