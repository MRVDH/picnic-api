import type HttpClient from "../../http-client";
import type { Cart } from "../cart/types";
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
    addProductToRecipe(productId: string, recipeId: string, sectionId?: string, count?: number): Promise<Cart>;
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
    removeProductFromRecipe(productId: string, recipeId: string, sectionId?: string, count?: number): Promise<Cart>;
}
//# sourceMappingURL=service.d.ts.map