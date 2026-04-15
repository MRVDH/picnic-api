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
}
exports.RecipeService = RecipeService;
//# sourceMappingURL=service.js.map