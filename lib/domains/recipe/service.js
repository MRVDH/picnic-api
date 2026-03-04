"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeService = void 0;
class RecipeService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns the meals / recipes overview page.
     * This is a Fusion page listing available recipes, categories, and promotions.
     */
    getRecipesPage() {
        return this.http.sendRequest("GET", `/pages/meals-page-root`, null, true);
    }
    /**
     * Returns the detail page for a single recipe.
     * Contains ingredients, cooking steps, servings, cooking time, and pricing.
     * @param {string} recipeId The id of the recipe to get details for.
     */
    getRecipeDetailsPage(recipeId) {
        return this.http.sendRequest("GET", `/pages/recipe-details-page-root?recipe_id=${encodeURIComponent(recipeId)}`, null, true);
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
     * Adds a product to the shopping cart in the context of a recipe.
     *
     * This calls the standard `POST /cart/add_product` endpoint but includes
     * `selling_unit_contexts` so Picnic knows the addition originated from a
     * recipe. The context is used for analytics and for the recipe stepper UI.
     *
     * @param {string} productId The selling-unit / article id.
     * @param {string} recipeId The recipe the product belongs to.
     * @param {string} [sectionId] The section within the recipe (optional).
     * @param {number} [count=1] How many units to add.
     */
    addProductToRecipe(productId, recipeId, sectionId, count = 1) {
        const context = {
            type: "RECIPE",
            recipe_id: recipeId,
            ...(sectionId && { section_id: sectionId }),
        };
        return this.http.sendRequest("POST", `/cart/add_product`, {
            product_id: productId,
            count,
            selling_unit_contexts: [context],
        });
    }
    /**
     * Removes a product from the shopping cart in the context of a recipe.
     *
     * This calls the standard `POST /cart/remove_product` endpoint but includes
     * `selling_unit_contexts` so Picnic knows the removal originated from a recipe.
     *
     * @param {string} productId The selling-unit / article id.
     * @param {string} recipeId The recipe the product belongs to.
     * @param {string} [sectionId] The section within the recipe (optional).
     * @param {number} [count=1] How many units to remove.
     */
    removeProductFromRecipe(productId, recipeId, sectionId, count = 1) {
        const context = {
            type: "RECIPE",
            recipe_id: recipeId,
            ...(sectionId && { section_id: sectionId }),
        };
        return this.http.sendRequest("POST", `/cart/remove_product`, {
            product_id: productId,
            count,
            selling_unit_contexts: [context],
        });
    }
}
exports.RecipeService = RecipeService;
//# sourceMappingURL=service.js.map