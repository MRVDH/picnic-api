// ─── Recipe Saving types ─────────────────────────────────────────────────────

/**
 * Payload describing which recipe to save or unsave.
 *
 * When `saved_at` is an ISO-8601 timestamp string the recipe is **saved**.
 * When `saved_at` is `null` the recipe is **unsaved**.
 */
export type RecipeSavingPayload = {
  recipe_id: string;
  saved_at: string | null;
};

/**
 * Request body sent to `POST /pages/task/recipe-saving`.
 */
export type RecipeSavingInput = {
  payload: RecipeSavingPayload;
};

// ─── Add Recipe Section to Cart ──────────────────────────────────────────────

/**
 * Context passed when mutating a selling unit from a recipe.
 * Allows Picnic to track which recipe and section triggered the cart change.
 *
 * The existing `POST /cart/add_product` and `POST /cart/remove_product`
 * endpoints accept an optional `selling_unit_contexts` array. When the
 * mutation originates from a recipe, one entry of this type is included.
 */
export type SellingUnitMutationRecipeContext = {
  type: "RECIPE" | "RECIPES";
  recipe_id: string;
  section_id?: string;
  recipe_section_id?: string;
  recipe_ingredient_type?: string;
};

/**
 * Input for adding / removing a product via the cart endpoints,
 * enriched with the recipe selling-unit context.
 */
export type RecipeProductInput = {
  product_id: string;
  count: number;
  selling_unit_contexts?: SellingUnitMutationRecipeContext[];
};
