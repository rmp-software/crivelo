// Coa homepage (RMP-191). The Crivelo shell (header / nav / footer) is provided
// by the [locale] layout; this page renders the calculator body inside it. The
// CoaCalculator owns the idle ↔ brew view state and the responsive layout. Copy
// stays English for now; full i18n is RMP-193.
import { CoaCalculator } from "../../components/coa";

export default function HomePage() {
  return <CoaCalculator />;
}
