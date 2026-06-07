/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Inline @import (e.g. @crivelo/tokens foundation CSS) BEFORE Tailwind runs,
    // so @layer blocks in imported files resolve against the @tailwind directives.
    "postcss-import": {},
    tailwindcss: {},
  },
};

export default config;
