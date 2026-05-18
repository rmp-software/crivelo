# Fonts Directory

This directory should contain the following font files from the Crema Arena design system:

- `BricolageGrotesque-VariableFont_opsz_wdth_wght.ttf`
- `InstrumentSerif-Regular.ttf`
- `InstrumentSerif-Italic.ttf`
- `GeistMono-VariableFont_wght.ttf`

These files are referenced in `app/globals.css` via `@font-face` declarations.

**Note:** For development without the actual font files, the CSS includes fallback fonts:
- Bricolage Grotesque → ui-sans-serif, system-ui, sans-serif
- Instrument Serif → Times New Roman, serif
- Geist Mono → ui-monospace, monospace
