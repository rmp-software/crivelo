import { LandingHeader } from "./components/landing/LandingHeader";
import { LandingHero } from "./components/landing/LandingHero";
import { LandingDoes } from "./components/landing/LandingDoes";
import { LandingFeat } from "./components/landing/LandingFeat";
import { LandingFooter } from "./components/landing/LandingFooter";

// Public landing page at `/` — the first consumer and reference implementation of
// the new UI foundation (Tailwind v4 @theme + shadcn from @crivelo/ui). Static
// structure/copy/responsive (RMP-203); motion + the hero duel loop + scroll-reveal
// layer on in RMP-204.
export default function Home() {
  return (
    <div className="bg-[var(--bg-inverse)] text-[var(--fg-inverse)]">
      <LandingHeader />
      <main id="top">
        <LandingHero />
        <LandingDoes />
        <LandingFeat />
      </main>
      <LandingFooter />
    </div>
  );
}
