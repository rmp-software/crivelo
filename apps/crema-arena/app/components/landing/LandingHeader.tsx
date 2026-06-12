import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";

// Sticky, translucent espresso header with blur. Left: monogram + "Crema Arena"
// wordmark (Crema serif italic, Arena display 800). Right: "Entrar" → /login.
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-crema-50/10 bg-espresso-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-7 max-[560px]:px-[18px]">
        <Link
          href="#top"
          aria-label="Crema Arena — início"
          className="inline-flex items-center gap-3 rounded-sm no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
        >
          <Image src="/assets/monogram.svg" alt="" width={34} height={34} className="block" />
          <span className="whitespace-nowrap text-[22px] leading-none max-[560px]:text-[19px]">
            <span className="font-serif italic text-crema-50">Crema</span>
            <span className="ml-1 font-display font-extrabold text-cinnamon-300">Arena</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-[44px] items-center gap-[7px] rounded-sm px-4 py-[9px] font-body text-mono font-medium text-crema-200 no-underline transition-colors hover:bg-espresso-700 hover:text-crema-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
        >
          Entrar
          <LogIn className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
