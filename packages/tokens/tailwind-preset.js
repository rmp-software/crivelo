/**
 * @crivelo/tokens — Tailwind preset (Tier 1 foundation, neutral house).
 * Re-exports the design-system scale as Tailwind aliases backed by the CSS
 * variables in styles/foundation.css. Consumed via `presets: [require(...)]`
 * in each app's tailwind.config; apps supply their own `content` globs and any
 * product-specific palette (e.g. Crema Arena's cinnamon / gold / live).
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        espresso: {
          950: "var(--espresso-950)",
          900: "var(--espresso-900)",
          800: "var(--espresso-800)",
          700: "var(--espresso-700)",
          600: "var(--espresso-600)",
          500: "var(--espresso-500)",
        },
        crema: {
          50: "var(--crema-50)",
          100: "var(--crema-100)",
          200: "var(--crema-200)",
          300: "var(--crema-300)",
          400: "var(--crema-400)",
        },
        sage: {
          100: "var(--sage-100)",
          500: "var(--sage-500)",
          700: "var(--sage-700)",
        },
        clay: {
          100: "var(--clay-100)",
          500: "var(--clay-500)",
          700: "var(--clay-700)",
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
        inset: "var(--shadow-inset)",
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
