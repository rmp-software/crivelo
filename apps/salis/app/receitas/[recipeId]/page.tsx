import { notFound } from "next/navigation";
import { content } from "../../content";
import { TopBar } from "../../top-bar";

/**
 * S2 · Receita — the pushed screen, and the one the frame needs in order to be
 * provable: it is not a root tab, so the shell hides the tab bar and the header
 * switches to the compact centred title with a back control.
 *
 * PLACEHOLDER BODY: RMP-254 builds the real counter screen (water amount, the
 * drop list as the hero, the GH/KH line, mixing order). Only the title is real,
 * read from Juliana's content so an unknown id 404s instead of rendering an
 * empty header.
 */
export default async function ReceitaPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const recipe = content.recipes.find((item) => item.id === recipeId);
  if (!recipe) {
    notFound();
  }

  return (
    <>
      {/* Hardcoded only until RMP-254 owns the water volume this reports. The
          handoff's JSDoc writes it lowercase ("para 1 L") but that illustrates
          the prop's SHAPE; rendered alone it is the whole text node, so the
          app's own sentence-case rule applies. */}
      <TopBar
        title={recipe.name_pt}
        subtitle="Para 1 L"
        backHref="/receitas"
      />
      <div className="flex flex-col gap-3 px-gutter pb-6">
        <p className="text-body text-fg-2">{recipe.promise_pt}</p>
        <p className="text-body-sm text-fg-3">
          As gotas de cada concentrado aparecem aqui.
        </p>
      </div>
    </>
  );
}
