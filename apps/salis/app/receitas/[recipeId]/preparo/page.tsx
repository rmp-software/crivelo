import { notFound } from "next/navigation";
import { content } from "../../../content";
import { PrepMode } from "./prep-mode";

/**
 * S3 · Modo preparo — the counter mode S2 pushes to.
 *
 * Same split as S2 (`../page.tsx`): the Server Component resolves the id so an
 * unknown recipe 404s on the server, and passes the recipe down so the client
 * island has no second lookup and no unreachable not-found branch.
 *
 * NOTHING about the dose is passed through the URL. The water volume lives in
 * the device store, so a deep link, a reload mid-prep and a push from S2 all
 * land on the same numbers — see `PrepMode`.
 */
export default async function PreparoPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const recipe = content.recipes.find((item) => item.id === recipeId);
  if (!recipe) {
    notFound();
  }

  return <PrepMode recipe={recipe} />;
}
