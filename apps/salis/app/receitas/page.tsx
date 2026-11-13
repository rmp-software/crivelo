import Link from "next/link";
import { content } from "../content";
import { TopBar } from "../top-bar";

/**
 * S1 · Receitas — the home tab.
 *
 * PLACEHOLDER BODY: RMP-253 builds the real list (sensory name, plane
 * thumbnail, GH/KH line, what the student is still missing). The names are
 * linked here only so the frame can be exercised — tapping one pushes the detail
 * screen, which is what hides the tab bar.
 */
export default function ReceitasPage() {
  return (
    <>
      <TopBar
        title="Receitas"
        subtitle="Escolha uma receita. As gotas são para 1 L."
      />
      <div className="flex flex-col gap-3 px-gutter pb-6">
        <p className="text-body text-fg-2">
          A lista de receitas da Juliana aparece aqui.
        </p>
        <ul className="flex flex-col">
          {content.recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/receitas/${recipe.id}`}
                className="flex min-h-tap-min items-center text-body font-medium text-link"
              >
                {recipe.name_pt}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
