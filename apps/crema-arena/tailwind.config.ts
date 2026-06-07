import type { Config } from "tailwindcss";
import crivelo from "@crivelo/tokens/tailwind";

const config: Config = {
  presets: [crivelo],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
};
export default config;
