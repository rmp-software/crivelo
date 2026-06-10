"use client";

/**
 * useRecipe (RMP-191) — recipe state over the framework-agnostic 4:6 engine
 * (lib/four-six.ts). Ported from docs/design/coa-v60/project/coa-shared.jsx; it
 * owns the four inputs (dose / ratio / acidity / strengthPours) and recomputes
 * the recipe from the engine on every change. The engine is the single source of
 * truth for the schedule — this hook never reimplements the math.
 */
import { useState } from "react";
import { computeRecipe, type Recipe } from "../../lib/four-six";

export interface RecipeInit {
  dose?: number;
  ratio?: number;
  acidity?: number;
  strengthPours?: number;
}

export interface UseRecipe {
  dose: number;
  setDose: (v: number) => void;
  ratio: number;
  setRatio: (v: number) => void;
  acidity: number;
  setAcidity: (v: number) => void;
  strengthPours: number;
  setStrength: (v: number) => void;
  recipe: Recipe;
}

export function useRecipe(init: RecipeInit = {}): UseRecipe {
  const [dose, setDose] = useState(init.dose ?? 20);
  const [ratio, setRatio] = useState(init.ratio ?? 15);
  const [acidity, setAcidity] = useState(init.acidity ?? 0);
  const [strengthPours, setStrength] = useState(init.strengthPours ?? 3);

  const recipe = computeRecipe({ dose, ratio, acidity, strengthPours });

  return {
    dose,
    setDose,
    ratio,
    setRatio,
    acidity,
    setAcidity,
    strengthPours,
    setStrength,
    recipe,
  };
}
