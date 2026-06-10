// Placeholder homepage. The real Coa 4:6 calculator + Crivelo shell land in
// later sub-issues; this just proves the scaffold (foundation fonts + tokens).
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "2rem",
        textAlign: "center",
        background: "var(--bg)",
        color: "var(--fg)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--fg-3)",
        }}
      >
        Crivelo
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
          fontWeight: 700,
          lineHeight: 1,
          margin: 0,
        }}
      >
        Coa
      </h1>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.5rem",
          color: "var(--fg-2)",
        }}
      >
        Coa — coming soon
      </p>
    </main>
  );
}
