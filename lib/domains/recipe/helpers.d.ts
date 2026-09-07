import { FusionPage } from "../../types/fusion";
import { RecipeDetails, RecipeSegment, RecipeSummary, UserDefinedRecipeSuggestedImage } from "./types";
/**
 * Extracts a cookbook segment in tile order, deduplicated by recipe id.
 * Catalog tiles often omit recipe_name in analytics; their SUBTITLE1 contains it.
 * Image source is null when the tile does not supply that metadata.
 */
export declare function extractRecipes(page: FusionPage, segmentType: RecipeSegment): RecipeSummary[];
/** Compatibility helper for the user's own cookbook segment. */
export declare function extractUserDefinedRecipes(page: FusionPage): RecipeSummary[];
/** Product-page fallback for ingredients without a visible tile, such as pantry staples. */
export declare function extractIngredientProductName(page: FusionPage): string | null;
/**
 * Extracts structured details of a catalog or user-defined recipe from its
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
 * to get the stored quantities; `RecipeService.getRecipe` and `getUserDefinedRecipe` do this.
 * @param {string} recipeId The recipe id that was requested.
 * @param {FusionPage} page The raw page response.
 */
export declare function extractRecipeDetails(recipeId: string, page: FusionPage): RecipeDetails;
/** Compatibility name for the shared extractor; quantities here match displayedPortions. */
export declare const extractUserDefinedRecipeDetails: typeof extractRecipeDetails;
/**
 * Extracts the required amount per selling unit for every ingredient from a
 * `selling-group-content-wrapper` (or `selling-group-details-page`) response.
 * The quantities are scaled to the `portions` the page was requested with.
 * @param {unknown} page The raw page response.
 * @returns Ingredient id → (selling unit id → required amount).
 */
export declare function extractIngredientQuantities(page: unknown): Record<string, Record<string, number>>;
/** Applies default-portion quantities without mutating the input or approximating package rounding. */
export declare function normalizeRecipeQuantities(details: RecipeDetails, page: unknown): RecipeDetails;
/**
 * Extracts the suggested images from a `sellable-image-selection-page-root`
 * response. The page keeps them in the `ImageSelectionState` state boundary as
 * `referenceImagesById`; each entry is what the save button sends as
 * `reference_image`, with its id as `selected_image_id`.
 * @param {unknown} page The raw page response.
 */
export declare function extractSuggestedImages(page: unknown): UserDefinedRecipeSuggestedImage[];
//# sourceMappingURL=helpers.d.ts.map