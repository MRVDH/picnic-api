import type HttpClient from "../../http-client";
import type {
  RecipeSavingInput,
  AssignSellingGroupInput,
  UpdateSellingGroupPortionsInput,
  RemoveSellingGroupInput,
} from "./types";
import { FusionPage } from "../../types/fusion";

export class RecipeService {
  constructor(private http: HttpClient) {}

  /**
   * Returns the meals / recipes overview page.
   * This is a Fusion page listing available recipes, categories, and promotions.
   */
  getRecipesPage(): Promise<FusionPage> {
    return this.http.sendRequest<null, FusionPage>("GET", `/pages/meals-page-root`, null, true);
  }

  /**
   * Returns the detail page for a single recipe.
   * Contains ingredients, cooking steps, servings, cooking time, and pricing.
   * @param {string} recipeId The id of the recipe to get details for.
   */
  getRecipeDetailsPage(recipeId: string): Promise<FusionPage> {
    return this.http.sendRequest<null, FusionPage>("GET", `/pages/recipe-details-page-root?recipe_id=${encodeURIComponent(recipeId)}`, null, true);
  }

  /**
   * Saves a recipe to the user's saved recipes list.
   * Sends the current timestamp as `saved_at` to mark the recipe as saved.
   * @param {string} recipeId The id of the recipe to save.
   */
  saveRecipe(recipeId: string): Promise<Record<string, never>> {
    return this.http.sendRequest<RecipeSavingInput, Record<string, never>>(
      "POST",
      `/pages/task/recipe-saving`,
      {
        payload: {
          recipe_id: recipeId,
          saved_at: new Date().toISOString(),
        },
      },
      true,
    );
  }

  /**
   * Removes a recipe from the user's saved recipes list.
   * Sends `null` as `saved_at` to mark the recipe as unsaved.
   * @param {string} recipeId The id of the recipe to unsave.
   */
  unsaveRecipe(recipeId: string): Promise<Record<string, never>> {
    return this.http.sendRequest<RecipeSavingInput, Record<string, never>>(
      "POST",
      `/pages/task/recipe-saving`,
      {
        payload: {
          recipe_id: recipeId,
          saved_at: null,
        },
      },
      true,
    );
  }

  /**
   * Assigns a selling group (recipe bundle) to the basket in the meal planner.
   * @param {string} sellingGroupId The selling group / recipe id.
   * @param {number} [dayOffset] Which delivery day to plan for (relative to the selected slot).
   * @param {number} [portions] Number of servings.
   */
  assignSellingGroupToBasket(sellingGroupId: string, dayOffset?: number, portions?: number): Promise<Record<string, never>> {
    return this.http.sendRequest<AssignSellingGroupInput, Record<string, never>>(
      "POST",
      `/pages/task/assign-selling-group-to-basket`,
      {
        payload: {
          selling_group_id: sellingGroupId,
          ...(dayOffset !== undefined && { day_offset: dayOffset }),
          ...(portions !== undefined && { portions }),
        },
      },
      true,
    );
  }

  /**
   * Updates the number of portions for a selling group already in the basket.
   * @param {string} sellingGroupId The selling group / recipe id.
   * @param {number} dayOffset Which delivery day the recipe is planned for.
   * @param {number} portions The new number of servings.
   */
  updateSellingGroupPortions(sellingGroupId: string, dayOffset: number, portions: number): Promise<Record<string, never>> {
    return this.http.sendRequest<UpdateSellingGroupPortionsInput, Record<string, never>>(
      "POST",
      `/pages/task/update-selling-group-number-of-portions-task`,
      {
        payload: {
          selling_group_id: sellingGroupId,
          day_offset: dayOffset,
          portions,
        },
      },
      true,
    );
  }

  /**
   * Removes a selling group (recipe bundle) from the basket.
   * @param {string} sellingGroupId The selling group / recipe id to remove.
   */
  removeSellingGroupFromBasket(sellingGroupId: string): Promise<Record<string, never>> {
    return this.http.sendRequest<RemoveSellingGroupInput, Record<string, never>>(
      "POST",
      `/pages/task/remove-selling-group-from-basket`,
      {
        payload: {
          selling_group_id: sellingGroupId,
        },
      },
      true,
    );
  }
}
