import type { Config } from "tailwindcss";
import crivelo from "@crivelo/tokens/tailwind";

const config: Config = {
  presets: [crivelo],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Tier-2 accent: cinnamon belongs to Crema Arena, not the neutral house.
      colors: {
        cinnamon: {
          50: "var(--cinnamon-50)",
          500: "var(--cinnamon-500)",
          600: "var(--cinnamon-600)",
          700: "var(--cinnamon-700)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
