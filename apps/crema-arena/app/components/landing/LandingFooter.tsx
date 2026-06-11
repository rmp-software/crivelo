import Link from "next/link";
import Image from "next/image";

// Footer — espresso. Left: monogram + "Acesso sob convite. Já tem conta? Entrar"
// (Entrar → /login). Right: "Crema Arena · 2026" in mono.
export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--crema-50)]/10 bg-[var(--bg-inverse)] px-7 pt-10 pb-12 max-[560px]:px-[18px]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-[13px]">
          <Image src="/assets/monogram.svg" alt="" aria-hidden="true" width={28} height={28} />
          <span className="font-body text-sm text-[var(--crema-200)]">
            <b className="font-semibold text-[var(--crema-50)]">Acesso sob convite.</b> Já tem conta?{" "}
            <Link
              href="/login"
              className="rounded-sm font-semibold text-[var(--cinnamon-300)] no-underline hover:underline hover:underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Entrar
            </Link>
          </span>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--espresso-500)]">
          Crema Arena · 2026
        </div>
      </div>
    </footer>
  );
}
