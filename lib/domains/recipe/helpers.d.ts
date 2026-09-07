import { FusionPage } from "../../types/fusion";
import { UserDefinedRecipeDetails, UserDefinedRecipeSuggestedImage, UserDefinedRecipeSummary } from "./types";
/**
 * Extracts the user's own recipes from the cookbook page.
 *
 * The cookbook page has no structured list of recipes; each tile carries
 * analytics contexts, and tiles in the "Eigen recepten" segment have a
 * `segment` context with `segment_type: "USER_DEFINED_RECIPES"` next to a
 * `recipe` context holding `recipe_id`, `recipe_name` and `recipe_image_type`.
 * @param {FusionPage} page The raw `cookbook-page-content` response.
 */
export declare function extractUserDefinedRecipes(page: FusionPage): UserDefinedRecipeSummary[];
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
export declare function extractUserDefinedRecipeDetails(recipeId: string, page: FusionPage): UserDefinedRecipeDetails;
/**
 * Extracts the required amount per selling unit for every ingredient from a
 * `selling-group-content-wrapper` (or `selling-group-details-page`) response.
 * The quantities are scaled to the `portions` the page was requested with.
 * @param {unknown} page The raw page response.
 * @returns Ingredient id → (selling unit id → required amount).
 */
export declare function extractIngredientQuantities(page: unknown): Record<string, Record<string, number>>;
/**
 * Extracts the suggested images from a `sellable-image-selection-page-root`
 * response. The page keeps them in the `ImageSelectionState` state boundary as
 * `referenceImagesById`; each entry is what the save button sends as
 * `reference_image`, with its id as `selected_image_id`.
 * @param {unknown} page The raw page response.
 */
export declare function extractSuggestedImages(page: unknown): UserDefinedRecipeSuggestedImage[];
//# sourceMappingURL=helpers.d.ts.map