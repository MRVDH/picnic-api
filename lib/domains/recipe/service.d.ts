import type HttpClient from "../../http-client";
import type { UserDefinedRecipeSummary, UserDefinedRecipeDetails, NewUserDefinedRecipeIngredient, CreateUserDefinedRecipeResult, AddUserDefinedRecipeIngredientResult, UpdateUserDefinedRecipeIngredientResult, UserDefinedRecipeImageUpload, UserDefinedRecipeImageUploadResult } from "./types";
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
     */
    getRecipeDetailsPage(recipeId: string): Promise<FusionPage>;
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
    assignSellingGroupToBasket(sellingGroupId: string, dayOffset?: number, portions?: number): Promise<Record<string, never>>;
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
    removeSellingGroupFromBasket(sellingGroupId: string): Promise<Record<string, never>>;
    /**
     * Lists the user's own (user defined) recipes.
     * Fetches the cookbook page and extracts the tiles of the `USER_DEFINED_RECIPES`
     * ("Eigen recepten") segment.
     */
    getUserDefinedRecipes(): Promise<UserDefinedRecipeSummary[]>;
    /**
     * Returns structured details (name, portions, ingredients, note) of a user
     * defined recipe. Fetches {@link getRecipeDetailsPage} and extracts the data.
     *
     * The details page renders the recipe at a multiple of its default portions
     * with scaled quantities. When that happens, the ingredient list sub-page
     * (`selling-group-content-wrapper`) is fetched once more at the default
     * portions so that `ingredients[].quantity` reflects the stored values.
     *
     * Note: the page may answer `Error rendering page_id='selling-group-details-page'`
     * for a second or so right after a mutation; retry in that case.
     * @param {string} recipeId The recipe id (a `selling_group_id`, 32 hex chars).
     */
    getUserDefinedRecipe(recipeId: string): Promise<UserDefinedRecipeDetails>;
    /**
     * Returns the image selection page for a user defined recipe, listing the
     * suggested images the user can pick from with {@link selectUserDefinedRecipeImage}.
     * Unlike most pages this route returns the bare page layout without the `{ script, layout }` envelope.
     * @param {string} recipeId The recipe id.
     */
    getUserDefinedRecipeImageSelectionPage(recipeId: string): Promise<FusionPageLayout>;
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
     * Mirrors the save button of `selling-group-component-edit-page?is_udr=true`.
     * @param {string} recipeId The recipe id.
     * @param {string} ingredientId The ingredient (selling group component) id.
     * @param {Record<string, number>} sellingUnitQuantities Selling unit id → quantity for this ingredient.
     * @param {number} [portions=4] The recipe's number of portions the quantities are based on.
     * @param {string|null} [swapType] Swap type, when the product was swapped.
     */
    updateUserDefinedRecipeIngredient(recipeId: string, ingredientId: string, sellingUnitQuantities: Record<string, number>, portions?: number, swapType?: string | null): Promise<UpdateUserDefinedRecipeIngredientResult>;
    /**
     * Removes an ingredient from a user defined recipe.
     * @param {string} recipeId The recipe id.
     * @param {string} ingredientId The ingredient (selling group component) id.
     */
    removeUserDefinedRecipeIngredient(recipeId: string, ingredientId: string): Promise<Record<string, never>>;
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
     * @param {unknown} [referenceImage] Reference image metadata, for suggested images.
     */
    selectUserDefinedRecipeImage(recipeId: string, imageId: string, referenceImage?: unknown): Promise<Record<string, never>>;
}
//# sourceMappingURL=service.d.ts.map