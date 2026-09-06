import { FusionPage } from "../../types/fusion";
import { UserDefinedRecipeDetails, UserDefinedRecipeIngredient, UserDefinedRecipeSummary } from "./types";

const RECIPE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/";
const SEGMENT_SCHEMA = "iglu:tech.picnic.snowplow.analytics/segment/jsonschema/";

type AnalyticsContext = { schema?: string; data?: Record<string, any> };

/** Recursively visit every array in a JSON tree. */
const walkArrays = (node: unknown, visit: (arr: unknown[]) => void): void => {
  if (Array.isArray(node)) {
    visit(node);
    node.forEach((child) => walkArrays(child, visit));
  } else if (node && typeof node === "object") {
    Object.values(node as Record<string, unknown>).forEach((child) => walkArrays(child, visit));
  }
};

/** Recursively visit every object in a JSON tree. */
const walkObjects = (node: unknown, visit: (obj: Record<string, any>) => void): void => {
  if (Array.isArray(node)) {
    node.forEach((child) => walkObjects(child, visit));
  } else if (node && typeof node === "object") {
    visit(node as Record<string, any>);
    Object.values(node as Record<string, unknown>).forEach((child) => walkObjects(child, visit));
  }
};

const isContextArray = (arr: unknown[]): arr is AnalyticsContext[] =>
  arr.length > 0 && arr.every((item) => item && typeof item === "object" && typeof (item as AnalyticsContext).schema === "string");

/**
 * Extracts the user's own recipes from the cookbook page.
 *
 * The cookbook page has no structured list of recipes; each tile carries
 * analytics contexts, and tiles in the "Eigen recepten" segment have a
 * `segment` context with `segment_type: "USER_DEFINED_RECIPES"` next to a
 * `recipe` context holding `recipe_id`, `recipe_name` and `recipe_image_type`.
 * @param {FusionPage} page The raw `cookbook-page-content` response.
 */
export function extractUserDefinedRecipes(page: FusionPage): UserDefinedRecipeSummary[] {
  const byId = new Map<string, UserDefinedRecipeSummary>();

  walkArrays(page, (arr) => {
    if (!isContextArray(arr)) return;
    const segment = arr.find((c) => c.schema?.startsWith(SEGMENT_SCHEMA));
    if (segment?.data?.segment_type !== "USER_DEFINED_RECIPES") return;
    const recipe = arr.find((c) => c.schema?.startsWith(RECIPE_SCHEMA))?.data;
    if (!recipe?.recipe_id || byId.has(recipe.recipe_id)) return;
    byId.set(recipe.recipe_id, {
      id: recipe.recipe_id,
      name: recipe.recipe_name ?? "",
      imageType: recipe.recipe_image_type ?? null,
    });
  });

  return [...byId.values()];
}

/**
 * Extracts structured details of a user defined recipe from its
 * `selling-group-details-page` response.
 *
 * The page embeds the recipe as an analytics `recipe` context (name, displayed
 * portions, image type and the full `selling_units` list), a header object with
 * `creator_type` / `default_portions` / `is_saved`, an `is_recipe_owner` flag
 * and, when present, the note as the `initialContent` of a `TEXT_EDITOR` component.
 *
 * The page renders the recipe at a display portion count that is a multiple of
 * the stored default (e.g. a 2-portion recipe is shown at 4 portions with doubled
 * quantities), so the ingredient quantities returned here are for
 * `displayedPortions`. Use {@link extractIngredientQuantities} on the
 * `selling-group-content-wrapper` sub-page requested with `portions=<default>`
 * to get the stored quantities; `RecipeService.getUserDefinedRecipe` does this.
 * @param {string} recipeId The recipe id that was requested.
 * @param {FusionPage} page The raw page response.
 */
export function extractUserDefinedRecipeDetails(recipeId: string, page: FusionPage): UserDefinedRecipeDetails {
  let recipeContext: Record<string, any> | undefined;
  let header: Record<string, any> | undefined;
  let owner: Record<string, any> | undefined;
  let note: string | null = null;

  walkObjects(page, (obj) => {
    if (!recipeContext && obj.recipe_id === recipeId && Array.isArray(obj.selling_units) && typeof obj.recipe_name === "string") {
      recipeContext = obj;
    }
    if (!header && typeof obj.creator_type === "string" && typeof obj.sellable_name === "string") {
      header = obj;
    }
    if (!owner && typeof obj.is_recipe_owner === "boolean" && typeof obj.name === "string") {
      owner = obj;
    }
    if (note === null && obj.type === "TEXT_EDITOR" && typeof obj.initialContent === "string") {
      note = obj.initialContent;
    }
  });

  const ingredients: UserDefinedRecipeIngredient[] = (recipeContext?.selling_units ?? []).map((unit: Record<string, any>) => ({
    ingredientId: unit.ingredient_id,
    sellingUnitId: unit.selling_unit_id,
    quantity: unit.quantity ?? 1,
    status: unit.status ?? "ACTIVE",
    swapType: unit.swap_type ?? null,
    checked: unit.checked ?? true,
  }));

  return {
    id: recipeId,
    name: recipeContext?.recipe_name ?? header?.sellable_name ?? owner?.name ?? "",
    portions: header?.default_portions ?? recipeContext?.portions ?? 0,
    displayedPortions: recipeContext?.portions ?? header?.default_portions ?? 0,
    creatorType: header?.creator_type ?? "USER",
    isRecipeOwner: owner?.is_recipe_owner ?? false,
    isSaved: header?.is_saved ?? false,
    imageType: recipeContext?.image_type ?? null,
    ingredients,
    note,
  };
}

/**
 * Extracts the required amount per selling unit for every ingredient from a
 * `selling-group-content-wrapper` (or `selling-group-details-page`) response.
 * The quantities are scaled to the `portions` the page was requested with.
 * @param {unknown} page The raw page response.
 * @returns Ingredient id → (selling unit id → required amount).
 */
export function extractIngredientQuantities(page: unknown): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  walkObjects(page, (obj) => {
    if (obj.type !== "STATE_BOUNDARY" || obj.id !== "sellableContentState") return;
    for (const ingredient of obj.state?.ingredientsState ?? []) {
      if (!ingredient?.ingredientId || !ingredient.sellingUnits) continue;
      result[ingredient.ingredientId] = Object.fromEntries(
        Object.values(ingredient.sellingUnits as Record<string, any>).map((unit) => [unit.sellingUnitId, unit.requiredAmount ?? 0]),
      );
    }
  });
  return result;
}
