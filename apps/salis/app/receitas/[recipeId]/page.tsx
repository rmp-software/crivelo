import { notFound } from "next/navigation";
import { content } from "../../content";
import { RecipeCounter } from "./recipe-counter";

/**
 * S2 · Receita — the counter screen.
 *
 * The page itself is a Server Component and does exactly one thing: resolve the
 * id, so an unknown recipe 404s on the server instead of rendering a header
 * over nothing. Everything below it depends on device state — the last water
 * volume, this device's dropper calibration, what is on the shelf — so the
 * screen itself is the client island.
 *
 * The resolved recipe is PASSED DOWN rather than looked up again on the client.
 * It costs one recipe's worth of JSON in the RSC payload (the content module is
 * already in the client bundle, so every other lookup down there stays free),
 * and it buys a `RecipeCounter` with no unreachable not-found branch of its own.
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

  return <RecipeCounter recipe={recipe} />;
}
