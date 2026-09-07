import type HttpClient from "../../http-client";
import type { RecipeSummary, RecipeDetails, RecipeDetailsOptions, AssignSellingGroupToBasketResult, RemoveSellingGroupFromBasketResult, UserDefinedRecipeSummary, UserDefinedRecipeDetails, NewUserDefinedRecipeIngredient, CreateUserDefinedRecipeResult, AddUserDefinedRecipeIngredientResult, UpdateUserDefinedRecipeIngredientResult, RemoveUserDefinedRecipeIngredientResult, AssignSellableComponentToDayResult, SellingGroupSwapType, UserDefinedRecipeReferenceImage, UserDefinedRecipeSuggestedImage, UserDefinedRecipeImageUpload, UserDefinedRecipeImageUploadResult } from "./types";
import { FusionPage, FusionPageLayout } from "../../types/fusion";
export declare class RecipeService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns the meals / meal-planner overview page.
     * This Fusion page is the meal planner root; its recipe content is loaded
     * lazily via SUSPENSE boundaries. To list the user's recipes, use
     * {@link getCookbookPage}.
     */
    getRecipesPage(): Promise<FusionPage>;
    /**
     * Returns the cookbook page, listing the user's recipes grouped by segment.
     * Each recipe tile carries a `segment_type` analytics context, e.g.
     * `SAVED_RECIPES` (saved/favourites), `USER_DEFINED_RECIPES` (the user's own
     * recipes), `NEW_RECIPES`, `THIS_WEEK_RECIPES`, …
     */
    getCookbookPage(): Promise<FusionPage>;
    /**
     * Returns the detail page for a single recipe.
     *
     * Recipes are modelled as "selling groups", so a recipe id is a
     * `selling_group_id` and the detail page is served from
     * `selling-group-details-page`. The previous `recipe-details-page-root`
     * route is no longer served and responds with HTTP 404
     * (`page-template with id 'recipe-details-page-root' was not found`).
     *
     * Contains ingredients, cooking steps, servings, cooking time, and pricing.
     * @param {string} recipeId The id of the recipe (a `selling_group_id`; 24 hex
     *   chars for catalog recipes, 32 for the user's own recipes).
     * @param {number} [portions] Render this many portions; omit to use the app's selection.
     */
    getRecipeDetailsPage(recipeId: string, portions?: number): Promise<FusionPage>;
    /**
     * Lists saved recipes from the cookbook's SAVED_RECIPES segment.
     * Returns the same summary shape as {@link getUserDefinedRecipes}; use
     * {@link getRecipe} for structured ingredients and other details.
     * Parses dynamic Fusion/PML tiles and may need updates if Picnic changes them.
     */
    getSavedRecipes(): Promise<RecipeSummary[]>;
    /**
     * Returns structured catalog or user-defined recipe details at the requested
     * portions, or the stored default when omitted. If the app initially renders a
     * different count, refetches the full page so names, product ids and quantities
     * come from the same response. Products may change with the portion count.
     * `defaultPortions` retains the stored default; `portions` describes the result.
     *
     * Ingredient names come from recipe tiles. Set `resolveIngredientNames` to true
     * to fetch missing names from product pages concurrently; otherwise they remain
     * null. These extra requests can fail the call. Quantities are selling-unit
     * counts, not weights or volumes. The image id includes its namespace.
     *
     * Parses dynamic Fusion/PML and may need updates when Picnic changes its pages.
     * Use {@link getRecipeDetailsPage} for raw cooking steps, time and pricing.
     * The backend can briefly fail after mutations; deleted recipes fail persistently.
     * Some recipes reject particular portion counts with a page-rendering error.
     * @param {string} recipeId The selling group id of either kind of recipe.
     * @param {number} [portions] Positive integer portion count; defaults to the stored count.
     * @param {RecipeDetailsOptions} [options] Optional product-name lookup requests.
     */
    getRecipe(recipeId: string, portions?: number, options?: RecipeDetailsOptions): Promise<RecipeDetails>;
    /**
     * Saves a recipe to the user's saved recipes list.
     * Sends the current timestamp as `saved_at` to mark the recipe as saved.
     * @param {string} recipeId The id of the recipe to save.
     */
    saveRecipe(recipeId: string): Promise<Record<string, never>>;
    /**
     * Removes a recipe from the user's saved recipes list.
     * Sends `null` as `saved_at` to mark the recipe as unsaved.
     * @param {string} recipeId The id of the recipe to unsave.
     */
    unsaveRecipe(recipeId: string): Promise<Record<string, never>>;
    /**
     * Assigns a selling group (recipe bundle) to the basket in the meal planner.
     * @param {string} sellingGroupId The selling group / recipe id.
     * @param {number} [dayOffset] Which delivery day to plan for (relative to the selected slot).
     * @param {number} [portions] Number of servings.
     */
    assignSellingGroupToBasket(sellingGroupId: string, dayOffset?: number, portions?: number): Promise<AssignSellingGroupToBasketResult>;
    /**
     * Updates the number of portions for a selling group already in the basket.
     * @param {string} sellingGroupId The selling group / recipe id.
     * @param {number} dayOffset Which delivery day the recipe is planned for.
     * @param {number} portions The new number of servings.
     */
    updateSellingGroupPortions(sellingGroupId: string, dayOffset: number, portions: number): Promise<Record<string, never>>;
    /**
     * Removes a selling group (recipe bundle) from the basket.
     * @param {string} sellingGroupId The selling group / recipe id to remove.
     */
    removeSellingGroupFromBasket(sellingGroupId: string): Promise<RemoveSellingGroupFromBasketResult>;
    /**
     * Lists the user's own (user defined) recipes.
     * Fetches the cookbook page and extracts the tiles of the `USER_DEFINED_RECIPES`
     * ("Eigen recepten") segment, with the same summary shape as {@link getSavedRecipes}.
     */
    getUserDefinedRecipes(): Promise<UserDefinedRecipeSummary[]>;
    /**
     * Returns the same structured details as {@link getRecipe}, including ingredient
     * names and quantities for the requested or default portions. Extra product-name
     * requests are opt-in, as with getRecipe.
     * @param {string} recipeId The user-defined recipe's selling group id.
     * @param {number} [portions] Requested count; defaults to the stored count.
     * @param {RecipeDetailsOptions} [options] Optional product-name lookup requests.
     */
    getUserDefinedRecipe(recipeId: string, portions?: number, options?: RecipeDetailsOptions): Promise<UserDefinedRecipeDetails>;
    /**
     * Returns the image selection page for a user defined recipe, listing the
     * suggested images the user can pick from with {@link selectUserDefinedRecipeImage}.
     * Unlike most pages this route returns the bare page layout without the `{ script, layout }` envelope.
     * @param {string} recipeId The recipe id.
     */
    getUserDefinedRecipeImageSelectionPage(recipeId: string): Promise<FusionPageLayout>;
    /**
     * Returns the suggested images for a user defined recipe, extracted from
     * {@link getUserDefinedRecipeImageSelectionPage}. Pass an entry's `id` and
     * `referenceImage` to {@link selectUserDefinedRecipeImage}.
     * @param {string} recipeId The recipe id.
     */
    getUserDefinedRecipeSuggestedImages(recipeId: string): Promise<UserDefinedRecipeSuggestedImage[]>;
    /**
     * Creates a new user defined recipe.
     * Mirrors the "Lijstje opslaan" button of `user-defined-recipe-root`, which posts
     * to `create-user-defined-recipe` and receives the new `sellingGroupId`.
     * @param {string} name The recipe name (the app limits it to 43 characters).
     * @param {NewUserDefinedRecipeIngredient[]} ingredients The products to include.
     * @param {number} [portions=4] Default number of portions the quantities are based on.
     */
    createUserDefinedRecipe(name: string, ingredients: NewUserDefinedRecipeIngredient[], portions?: number): Promise<CreateUserDefinedRecipeResult>;
    /**
     * Renames a user defined recipe.
     * @param {string} recipeId The recipe id.
     * @param {string} name The new name (the app limits it to 43 characters).
     */
    renameUserDefinedRecipe(recipeId: string, name: string): Promise<Record<string, never>>;
    /**
     * Changes the default number of portions of a user defined recipe.
     * @param {string} recipeId The recipe id.
     * @param {number} portions The new default number of portions.
     */
    updateUserDefinedRecipePortions(recipeId: string, portions: number): Promise<Record<string, never>>;
    /**
     * Deletes a user defined recipe and all its ingredients.
     * The app follows this with `remove-sellable-context-from-basket` for the same
     * `sellable_id` when the recipe is in the basket; call
     * {@link removeSellingGroupFromBasket} first if you need that behaviour.
     * @param {string} recipeId The recipe id.
     */
    deleteUserDefinedRecipe(recipeId: string): Promise<Record<string, never>>;
    /**
     * Adds a product as a new ingredient to a user defined recipe.
     * Mirrors the product tiles on the ingredient search page (`page_context=RECIPE_EDITING`).
     * @param {string} recipeId The recipe id.
     * @param {string} sellingUnitId The product (selling unit) id, e.g. `s1143210`.
     * @param {number} [quantity=1] Number of selling units for `portions` portions.
     * @param {number} [portions=4] The recipe's number of portions the quantity is based on.
     * @param {number} [order] Position in the ingredient list; the app sends the current ingredient count.
     */
    addUserDefinedRecipeIngredient(recipeId: string, sellingUnitId: string, quantity?: number, portions?: number, order?: number): Promise<AddUserDefinedRecipeIngredientResult>;
    /**
     * Updates an ingredient of a user defined recipe: change its quantity, or swap
     * the product by passing a different selling unit id.
     * Mirrors the save button of `selling-group-component-edit-page?is_udr=true`. When
     * swapping an ingredient that has more than one selling unit, include each of its
     * current selling unit ids with quantity `0` next to the new selection.
     *
     * A response with `shouldUpdateCart: true` means the recipe is in the basket with a
     * selection that differs from this one; call {@link assignSellableComponentToDay}
     * with the same selection to update the basket.
     * @param {string} recipeId The recipe id.
     * @param {string} ingredientId The ingredient (selling group component) id.
     * @param {Record<string, number>} sellingUnitQuantities Selling unit id → quantity for this ingredient.
     * @param {number} [portions=4] The recipe's number of portions the quantities are based on.
     * @param {SellingGroupSwapType|null} [swapType] Swap type, when the product was swapped.
     */
    updateUserDefinedRecipeIngredient(recipeId: string, ingredientId: string, sellingUnitQuantities: Record<string, number>, portions?: number, swapType?: SellingGroupSwapType | null): Promise<UpdateUserDefinedRecipeIngredientResult>;
    /**
     * Pushes an updated ingredient selection of a recipe that is in the basket to the
     * basket. The app calls this after {@link updateUserDefinedRecipeIngredient}
     * returned `shouldUpdateCart: true`. The edit task itself removes the replaced
     * product from the basket; this call adds the new selection, so without it the
     * basket lacks that ingredient.
     * @param {string} recipeId The recipe id.
     * @param {string} ingredientId The ingredient (selling group component) id.
     * @param {Record<string, number>} sellingUnitQuantities The selected selling unit id → quantity (only the selected ones, no zeroes).
     * @param {number} portions The recipe's number of portions the quantities are based on.
     * @param {SellingGroupSwapType} swapType The swap type that was sent to the edit task.
     */
    assignSellableComponentToDay(recipeId: string, ingredientId: string, sellingUnitQuantities: Record<string, number>, portions: number, swapType: SellingGroupSwapType): Promise<AssignSellableComponentToDayResult>;
    /**
     * Removes an ingredient from a user defined recipe.
     * @param {string} recipeId The recipe id.
     * @param {string} ingredientId The ingredient (selling group component) id.
     */
    removeUserDefinedRecipeIngredient(recipeId: string, ingredientId: string): Promise<RemoveUserDefinedRecipeIngredientResult>;
    /**
     * Sets (creates or replaces) the free-text note of a user defined recipe.
     * The note is HTML as produced by the app's editor, e.g. `<p>400g pasta</p><p>Kook de pasta.</p>`.
     * The app rejects notes whose text content exceeds 5000 characters.
     * @param {string} recipeId The recipe id.
     * @param {string} note The note as HTML.
     */
    setUserDefinedRecipeNote(recipeId: string, note: string): Promise<Record<string, never>>;
    /**
     * Deletes the note of a user defined recipe.
     * @param {string} recipeId The recipe id.
     */
    deleteUserDefinedRecipeNote(recipeId: string): Promise<Record<string, never>>;
    /**
     * Uploads a custom photo for a user defined recipe.
     * The app sends the raw image bytes to `POST /user-defined-sellable/{sellableId}`
     * with the image MIME type as `Content-Type` (not multipart; the server answers
     * 415 to multipart bodies) and then selects the returned `image_id` with
     * {@link selectUserDefinedRecipeImage}.
     * @param {string} recipeId The recipe id.
     * @param {UserDefinedRecipeImageUpload} image The image to upload.
     */
    uploadUserDefinedRecipeImage(recipeId: string, image: UserDefinedRecipeImageUpload): Promise<UserDefinedRecipeImageUploadResult>;
    /**
     * Sets the image of a user defined recipe, either a suggested image from
     * {@link getUserDefinedRecipeImageSelectionPage} or a photo uploaded with
     * {@link uploadUserDefinedRecipeImage}.
     * @param {string} recipeId The recipe id.
     * @param {string} imageId The image id to select.
     * @param {UserDefinedRecipeReferenceImage} [referenceImage] Reference image metadata, for suggested images (see {@link getUserDefinedRecipeSuggestedImages}).
     */
    selectUserDefinedRecipeImage(recipeId: string, imageId: string, referenceImage?: UserDefinedRecipeReferenceImage): Promise<Record<string, never>>;
}
//# sourceMappingURL=service.d.ts.map