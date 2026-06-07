/**
 * @crivelo/tokens — Tailwind preset (Tier 1 foundation).
 * Re-exports the design-system scale as Tailwind aliases backed by the CSS
 * variables in styles/foundation.css. Consumed via `presets: [require(...)]`
 * in each app's tailwind.config; apps supply their own `content` globs.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        espresso: {
          900: "var(--espresso-900)",
          700: "var(--espresso-700)",
          500: "var(--espresso-500)",
        },
        crema: {
          50: "var(--crema-50)",
          100: "var(--crema-100)",
          200: "var(--crema-200)",
          300: "var(--crema-300)",
        },
        marigold: {
          100: "var(--marigold-100)",
          500: "var(--marigold-500)",
        },
        mint: {
          100: "var(--mint-100)",
          500: "var(--mint-500)",
        },
        cherry: {
          100: "var(--cherry-100)",
          500: "var(--cherry-500)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        stage: "var(--dur-stage)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        overshoot: "var(--ease-overshoot)",
      },
    },
  },
};
