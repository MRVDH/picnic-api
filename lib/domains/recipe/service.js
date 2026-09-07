"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeService = void 0;
const service_1 = require("../catalog/service");
const helpers_1 = require("./helpers");
class RecipeService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns the meals / meal-planner overview page.
     * This Fusion page is the meal planner root; its recipe content is loaded
     * lazily via SUSPENSE boundaries. To list the user's recipes, use
     * {@link getCookbookPage}.
     */
    getRecipesPage() {
        return this.http.sendRequest("GET", `/pages/meals-page-root`, null, true);
    }
    /**
     * Returns the cookbook page, listing the user's recipes grouped by segment.
     * Each recipe tile carries a `segment_type` analytics context, e.g.
     * `SAVED_RECIPES` (saved/favourites), `USER_DEFINED_RECIPES` (the user's own
     * recipes), `NEW_RECIPES`, `THIS_WEEK_RECIPES`, …
     */
    getCookbookPage() {
        return this.http.sendRequest("GET", `/pages/cookbook-page-content`, null, true);
    }
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
    getRecipeDetailsPage(recipeId, portions) {
        if (portions !== undefined && (!Number.isSafeInteger(portions) || portions <= 0)) {
            throw new RangeError("Recipe portions must be a positive integer");
        }
        const query = portions === undefined ? "" : `&portions=${portions}`;
        return this.http.sendRequest("GET", `/pages/selling-group-details-page?selling_group_id=${encodeURIComponent(recipeId)}${query}`, null, true);
    }
    /**
     * Lists saved recipes from the cookbook's SAVED_RECIPES segment.
     * Returns the same summary shape as {@link getUserDefinedRecipes}; use
     * {@link getRecipe} for structured ingredients and other details.
     * Parses dynamic Fusion/PML tiles and may need updates if Picnic changes them.
     */
    async getSavedRecipes() {
        return (0, helpers_1.extractRecipes)(await this.getCookbookPage(), "SAVED_RECIPES");
    }
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
    async getRecipe(recipeId, portions, options = {}) {
        let details = (0, helpers_1.extractRecipeDetails)(recipeId, await this.getRecipeDetailsPage(recipeId, portions));
        const requestedPortions = portions ?? details.defaultPortions;
        if (details.portions !== requestedPortions) {
            details = (0, helpers_1.extractRecipeDetails)(recipeId, await this.getRecipeDetailsPage(recipeId, requestedPortions));
        }
        if (details.portions !== requestedPortions) {
            throw new Error(`Recipe ${recipeId} rendered ${details.portions} portions instead of ${requestedPortions}`);
        }
        if (options.resolveIngredientNames) {
            const catalog = new service_1.CatalogService(this.http);
            const names = new Map();
            await Promise.all(details.ingredients.map(async (ingredient) => {
                if (ingredient.name !== null || !ingredient.sellingUnitId)
                    return;
                let name = names.get(ingredient.sellingUnitId);
                if (!name) {
                    name = catalog.getProductDetailsPage(ingredient.sellingUnitId).then(helpers_1.extractIngredientProductName);
                    names.set(ingredient.sellingUnitId, name);
                }
                ingredient.name = await name;
            }));
        }
        return details;
    }
    /**
     * Saves a recipe to the user's saved recipes list.
     * Sends the current timestamp as `saved_at` to mark the recipe as saved.
     * @param {string} recipeId The id of the recipe to save.
     */
    saveRecipe(recipeId) {
        return this.http.sendRequest("POST", `/pages/task/recipe-saving`, {
            payload: {
                recipe_id: recipeId,
                saved_at: new Date().toISOString(),
            },
        }, true);
    }
    /**
     * Removes a recipe from the user's saved recipes list.
     * Sends `null` as `saved_at` to mark the recipe as unsaved.
     * @param {string} recipeId The id of the recipe to unsave.
     */
    unsaveRecipe(recipeId) {
        return this.http.sendRequest("POST", `/pages/task/recipe-saving`, {
            payload: {
                recipe_id: recipeId,
                saved_at: null,
            },
        }, true);
    }
    /**
     * Assigns a selling group (recipe bundle) to the basket in the meal planner.
     * @param {string} sellingGroupId The selling group / recipe id.
     * @param {number} [dayOffset] Which delivery day to plan for (relative to the selected slot).
     * @param {number} [portions] Number of servings.
     */
    assignSellingGroupToBasket(sellingGroupId, dayOffset, portions) {
        return this.http.sendRequest("POST", `/pages/task/assign-selling-group-to-basket`, {
            payload: {
                selling_group_id: sellingGroupId,
                ...(dayOffset !== undefined && { day_offset: dayOffset }),
                ...(portions !== undefined && { portions }),
            },
        }, true);
    }
    /**
     * Updates the number of portions for a selling group already in the basket.
     * @param {string} sellingGroupId The selling group / recipe id.
     * @param {number} dayOffset Which delivery day the recipe is planned for.
     * @param {number} portions The new number of servings.
     */
    updateSellingGroupPortions(sellingGroupId, dayOffset, portions) {
        return this.http.sendRequest("POST", `/pages/task/update-selling-group-number-of-portions-task`, {
            payload: {
                selling_group_id: sellingGroupId,
                day_offset: dayOffset,
                portions,
            },
        }, true);
    }
    /**
     * Removes a selling group (recipe bundle) from the basket.
     * @param {string} sellingGroupId The selling group / recipe id to remove.
     */
    removeSellingGroupFromBasket(sellingGroupId) {
        return this.http.sendRequest("POST", `/pages/task/remove-selling-group-from-basket`, {
            payload: {
                selling_group_id: sellingGroupId,
            },
        }, true);
    }
    // ─── User defined (custom) recipes ──────────────────────────────────────────
    //
    // The user's own recipes are "user defined recipes" (UDR): selling groups
    // with `creator_type: "USER"` and a 32-hex-character id. Their routes are not
    // declared in the app binary; they were extracted from the PML expressions of
    // the pages listed in `types.ts`. All mutations are `POST /pages/task/<id>`.
    /**
     * Lists the user's own (user defined) recipes.
     * Fetches the cookbook page and extracts the tiles of the `USER_DEFINED_RECIPES`
     * ("Eigen recepten") segment, with the same summary shape as {@link getSavedRecipes}.
     */
    async getUserDefinedRecipes() {
        return (0, helpers_1.extractRecipes)(await this.getCookbookPage(), "USER_DEFINED_RECIPES");
    }
    /**
     * Returns the same structured details as {@link getRecipe}, including ingredient
     * names and quantities for the requested or default portions. Extra product-name
     * requests are opt-in, as with getRecipe.
     * @param {string} recipeId The user-defined recipe's selling group id.
     * @param {number} [portions] Requested count; defaults to the stored count.
     * @param {RecipeDetailsOptions} [options] Optional product-name lookup requests.
     */
    getUserDefinedRecipe(recipeId, portions, options = {}) {
        return this.getRecipe(recipeId, portions, options);
    }
    /**
     * Returns the image selection page for a user defined recipe, listing the
     * suggested images the user can pick from with {@link selectUserDefinedRecipeImage}.
     * Unlike most pages this route returns the bare page layout without the `{ script, layout }` envelope.
     * @param {string} recipeId The recipe id.
     */
    getUserDefinedRecipeImageSelectionPage(recipeId) {
        return this.http.sendRequest("GET", `/pages/sellable-image-selection-page-root?origin=RECIPE_DETAILS&sellable_id=${encodeURIComponent(recipeId)}`, null, true);
    }
    /**
     * Returns the suggested images for a user defined recipe, extracted from
     * {@link getUserDefinedRecipeImageSelectionPage}. Pass an entry's `id` and
     * `referenceImage` to {@link selectUserDefinedRecipeImage}.
     * @param {string} recipeId The recipe id.
     */
    async getUserDefinedRecipeSuggestedImages(recipeId) {
        const page = await this.getUserDefinedRecipeImageSelectionPage(recipeId);
        return (0, helpers_1.extractSuggestedImages)(page);
    }
    /**
     * Creates a new user defined recipe.
     * Mirrors the "Lijstje opslaan" button of `user-defined-recipe-root`, which posts
     * to `create-user-defined-recipe` and receives the new `sellingGroupId`.
     * @param {string} name The recipe name (the app limits it to 43 characters).
     * @param {NewUserDefinedRecipeIngredient[]} ingredients The products to include.
     * @param {number} [portions=4] Default number of portions the quantities are based on.
     */
    createUserDefinedRecipe(name, ingredients, portions = 4) {
        const sellingUnits = ingredients.map((ingredient) => ingredient.sellingUnitId);
        const quantities = {};
        const sources = {};
        for (const ingredient of ingredients) {
            quantities[ingredient.sellingUnitId] = ingredient.quantity ?? 1;
            sources[ingredient.sellingUnitId] = ingredient.source ?? "search";
        }
        return this.http.sendRequest("POST", `/pages/task/create-user-defined-recipe`, {
            payload: {
                name,
                portions,
                selling_unit_quantities_by_id: quantities,
                selling_unit_sources: sources,
                selling_units: sellingUnits,
            },
        }, true);
    }
    /**
     * Renames a user defined recipe.
     * @param {string} recipeId The recipe id.
     * @param {string} name The new name (the app limits it to 43 characters).
     */
    renameUserDefinedRecipe(recipeId, name) {
        return this.http.sendRequest("POST", `/pages/task/update-name-user-defined-recipe`, { payload: { name, selling_group_id: recipeId } }, true);
    }
    /**
     * Changes the default number of portions of a user defined recipe.
     * @param {string} recipeId The recipe id.
     * @param {number} portions The new default number of portions.
     */
    updateUserDefinedRecipePortions(recipeId, portions) {
        return this.http.sendRequest("POST", `/pages/task/update-portions-user-defined-recipe`, { payload: { portions, sellable_id: recipeId } }, true);
    }
    /**
     * Deletes a user defined recipe and all its ingredients.
     * The app follows this with `remove-sellable-context-from-basket` for the same
     * `sellable_id` when the recipe is in the basket; call
     * {@link removeSellingGroupFromBasket} first if you need that behaviour.
     * @param {string} recipeId The recipe id.
     */
    deleteUserDefinedRecipe(recipeId) {
        return this.http.sendRequest("POST", `/pages/task/delete-user-defined-sellable`, { payload: { sellable_id: recipeId } }, true);
    }
    /**
     * Adds a product as a new ingredient to a user defined recipe.
     * Mirrors the product tiles on the ingredient search page (`page_context=RECIPE_EDITING`).
     * @param {string} recipeId The recipe id.
     * @param {string} sellingUnitId The product (selling unit) id, e.g. `s1143210`.
     * @param {number} [quantity=1] Number of selling units for `portions` portions.
     * @param {number} [portions=4] The recipe's number of portions the quantity is based on.
     * @param {number} [order] Position in the ingredient list; the app sends the current ingredient count.
     */
    addUserDefinedRecipeIngredient(recipeId, sellingUnitId, quantity = 1, portions = 4, order = 0) {
        return this.http.sendRequest("POST", `/pages/task/add-ingredient-task`, {
            payload: {
                order: String(order),
                quantity,
                requested_portions: String(portions),
                selling_group_id: recipeId,
                selling_unit_id: sellingUnitId,
            },
        }, true);
    }
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
    updateUserDefinedRecipeIngredient(recipeId, ingredientId, sellingUnitQuantities, portions = 4, swapType) {
        return this.http.sendRequest("POST", `/pages/task/save-selling-group-edit-task`, {
            payload: {
                requested_sellable_portions: String(portions),
                selling_group_component_id: ingredientId,
                selling_group_id: recipeId,
                selling_unit_quantity_by_id: sellingUnitQuantities,
                swapType: swapType ?? undefined,
            },
        }, true);
    }
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
    assignSellableComponentToDay(recipeId, ingredientId, sellingUnitQuantities, portions, swapType) {
        return this.http.sendRequest("POST", `/pages/task/assign-sellable-component-to-day`, {
            payload: {
                component_swap_type: swapType,
                portions: String(portions),
                required_amount_by_selling_unit_id: sellingUnitQuantities,
                selected_component_id: ingredientId,
                selling_group_id: recipeId,
            },
        }, true);
    }
    /**
     * Removes an ingredient from a user defined recipe.
     * @param {string} recipeId The recipe id.
     * @param {string} ingredientId The ingredient (selling group component) id.
     */
    removeUserDefinedRecipeIngredient(recipeId, ingredientId) {
        return this.http.sendRequest("POST", `/pages/task/delete-selling-group-component`, { payload: { selling_group_component_id: ingredientId, selling_group_id: recipeId } }, true);
    }
    /**
     * Sets (creates or replaces) the free-text note of a user defined recipe.
     * The note is HTML as produced by the app's editor, e.g. `<p>400g pasta</p><p>Kook de pasta.</p>`.
     * The app rejects notes whose text content exceeds 5000 characters.
     * @param {string} recipeId The recipe id.
     * @param {string} note The note as HTML.
     */
    setUserDefinedRecipeNote(recipeId, note) {
        return this.http.sendRequest("POST", `/pages/task/update-selling-group-note`, { payload: { note, selling_group_id: recipeId } }, true);
    }
    /**
     * Deletes the note of a user defined recipe.
     * @param {string} recipeId The recipe id.
     */
    deleteUserDefinedRecipeNote(recipeId) {
        return this.http.sendRequest("POST", `/pages/task/delete-selling-group-note-task`, { payload: { selling_group_id: recipeId } }, true);
    }
    /**
     * Uploads a custom photo for a user defined recipe.
     * The app sends the raw image bytes to `POST /user-defined-sellable/{sellableId}`
     * with the image MIME type as `Content-Type` (not multipart; the server answers
     * 415 to multipart bodies) and then selects the returned `image_id` with
     * {@link selectUserDefinedRecipeImage}.
     * @param {string} recipeId The recipe id.
     * @param {UserDefinedRecipeImageUpload} image The image to upload.
     */
    uploadUserDefinedRecipeImage(recipeId, image) {
        const type = (image.type ?? "image/jpeg").replace(/jpg/gi, "jpeg");
        const body = image.data instanceof Blob ? image.data : new Uint8Array(image.data);
        return this.http.sendRequest("POST", `/user-defined-sellable/${encodeURIComponent(recipeId)}`, body, true, false, type);
    }
    /**
     * Sets the image of a user defined recipe, either a suggested image from
     * {@link getUserDefinedRecipeImageSelectionPage} or a photo uploaded with
     * {@link uploadUserDefinedRecipeImage}.
     * @param {string} recipeId The recipe id.
     * @param {string} imageId The image id to select.
     * @param {UserDefinedRecipeReferenceImage} [referenceImage] Reference image metadata, for suggested images (see {@link getUserDefinedRecipeSuggestedImages}).
     */
    selectUserDefinedRecipeImage(recipeId, imageId, referenceImage) {
        return this.http.sendRequest("POST", `/pages/task/select-sellable-image`, {
            payload: {
                sellable_id: recipeId,
                selected_image_id: imageId,
                ...(referenceImage !== undefined && { reference_image: referenceImage }),
            },
        }, true);
    }
}
exports.RecipeService = RecipeService;
//# sourceMappingURL=service.js.map