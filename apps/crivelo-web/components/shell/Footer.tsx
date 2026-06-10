"use client";

/**
 * Footer (RMP-190) — CriveloLockup + tagline + sieve motif (SieveGrid fill mode)
 * + "The family" list + copyright + language toggle. Ported from coa-shell.jsx;
 * uses the centralized NAV_ITEMS. Client component because it embeds LangToggle.
 */
import { CriveloLockup, SieveGrid } from "../brand";
import { NAV_ITEMS } from "./nav";
import { LangToggle } from "./LangToggle";

const CAP = {
  fontSize: 11,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  fontWeight: 600,
  color: "var(--fg-3)",
};

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-2)",
        borderTop: "1px solid var(--border)",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1060,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "40px 24px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 22,
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <CriveloLockup size="lg" />
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 18,
                color: "var(--fg-2)",
              }}
            >
              Tools for people who live coffee.
            </span>
          </div>
          <SieveGrid
            cols={5}
            rows={5}
            gap={12}
            dot={3.4}
            pad={2}
            fill={0.36}
            color="var(--fg)"
            accent="var(--fg-3)"
          />
        </div>

        <div style={{ ...CAP, marginBottom: 10 }}>The family</div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 28,
            marginBottom: 24,
          }}
        >
          {NAV_ITEMS.map((it) => {
            const row = (
              <span
                style={{ display: "flex", alignItems: "center", gap: 9 }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: it.dot || "var(--fg-4)",
                    opacity: it.soon ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14.5,
                    color: it.soon ? "var(--fg-4)" : "var(--fg)",
                  }}
                >
                  {it.name}
                </span>
                {it.soon && (
                  <span style={{ fontSize: 11.5, color: "var(--fg-4)" }}>
                    soon
                  </span>
                )}
                {it.external && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--fg-3)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                )}
              </span>
            );
            return it.soon ? (
              <div key={it.name} style={{ padding: "5px 0" }}>
                {row}
              </div>
            ) : (
              <a
                key={it.name}
                href={it.href}
                target={it.external ? "_blank" : undefined}
                rel={it.external ? "noopener noreferrer" : undefined}
                style={{ padding: "5px 0", textDecoration: "none" }}
              >
                {row}
              </a>
            );
          })}
        </div>

        <div
          style={{
            height: 1,
            background: "var(--border)",
            marginBottom: 18,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
            © 2026 Crivelo · Para quem vive café.
          </span>
          <LangToggle />
        </div>
      </div>
    </footer>
  );
}
