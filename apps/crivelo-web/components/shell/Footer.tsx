"use client";

/**
 * Footer (RMP-190) — CriveloLockup + tagline + sieve motif (SieveGrid fill mode)
 * + "The family" list + copyright + language toggle. Ported from coa-shell.jsx;
 * uses the centralized NAV_ITEMS. Client component because it embeds LangToggle.
 */
import { useTranslations } from "next-intl";
import { CriveloLockup, SieveGrid } from "../brand";
import { Link } from "../../i18n/navigation";
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
  const t = useTranslations("Shell");
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
              {t("tagline")}
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

        <div style={{ ...CAP, marginBottom: 10 }}>{t("theFamily")}</div>
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
                    {t("soon")}
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
            if (it.soon || !it.href) {
              return (
                <div key={it.name} style={{ padding: "5px 0" }}>
                  {row}
                </div>
              );
            }
            return it.external ? (
              <a
                key={it.name}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "5px 0", textDecoration: "none" }}
              >
                {row}
              </a>
            ) : (
              <Link
                key={it.name}
                href={it.href}
                style={{ padding: "5px 0", textDecoration: "none" }}
              >
                {row}
              </Link>
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
          {/*
            The `copyright` message keeps the Portuguese tagline "Para quem vive
            café" in BOTH locales on purpose: it is Crivelo's primary brand
            signature, kept in its origin language like a motto. This is NOT a
            missed translation — do not "translate" it in messages/en.json.
          */}
          <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
            {t("copyright")}
          </span>
          <LangToggle />
        </div>
      </div>
    </footer>
  );
}
