import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        cinnamon: {
          50: "var(--cinnamon-50)",
          500: "var(--cinnamon-500)",
          600: "var(--cinnamon-600)",
          700: "var(--cinnamon-700)",
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
        "1": "var(--shadow-1)",
        "2": "var(--shadow-2)",
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
  plugins: [],
};
export default config;
