/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind v4: the PostCSS plugin handles @import resolution itself (including
    // `@import "@crivelo/tokens/..."`), so postcss-import is no longer needed.
    "@tailwindcss/postcss": {},
  },
};

export default config;
