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
  plugins: [],
};
export default config;
