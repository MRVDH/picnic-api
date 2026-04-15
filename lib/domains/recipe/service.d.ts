import type HttpClient from "../../http-client";
import { FusionPage } from "../../types/fusion";
export declare class RecipeService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns the meals / recipes overview page.
     * This is a Fusion page listing available recipes, categories, and promotions.
     */
    getRecipesPage(): Promise<FusionPage>;
    /**
     * Returns the detail page for a single recipe.
     * Contains ingredients, cooking steps, servings, cooking time, and pricing.
     * @param {string} recipeId The id of the recipe to get details for.
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
}
//# sourceMappingURL=service.d.ts.map