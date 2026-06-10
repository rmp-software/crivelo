"use client";

/**
 * Header (RMP-190) — sticky top bar: left hamburger → CoaLockup ("Coa by
 * Crivelo"); nothing on the right. Ported from coa-shell.jsx (the inline
 * CoaMark + wordmark is replaced by the shared CoaLockup brand component).
 *
 * Client component: it triggers the nav-sheet open state owned by Shell.
 */
import { forwardRef } from "react";
import { CoaLockup } from "../brand";

export const Header = forwardRef<HTMLButtonElement, { onMenu: () => void }>(
  function Header({ onMenu }, ref) {
    return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1060,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "0 16px",
          height: 66,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          ref={ref}
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          style={{
            width: 40,
            height: 40,
            marginLeft: -4,
            borderRadius: 999,
            border: "none",
            background: "transparent",
            color: "var(--fg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <a
          href="/"
          aria-label="Coa by Crivelo — home"
          style={{ textDecoration: "none", display: "inline-flex" }}
        >
          <CoaLockup size="sm" />
        </a>
      </div>
    </header>
    );
  },
);
