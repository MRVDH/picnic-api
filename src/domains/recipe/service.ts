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
   * Returns the meals / meal-planner overview page.
   * This Fusion page is the meal planner root; its recipe content is loaded
   * lazily via SUSPENSE boundaries. To list the user's recipes, use
   * {@link getCookbookPage}.
   */
  getRecipesPage(): Promise<FusionPage> {
    return this.http.sendRequest<null, FusionPage>("GET", `/pages/meals-page-root`, null, true);
  }

  /**
   * Returns the cookbook page, listing the user's recipes grouped by segment.
   * Each recipe tile carries a `segment_type` analytics context, e.g.
   * `SAVED_RECIPES` (saved/favourites), `USER_DEFINED_RECIPES` (the user's own
   * recipes), `NEW_RECIPES`, `THIS_WEEK_RECIPES`, …
   */
  getCookbookPage(): Promise<FusionPage> {
    return this.http.sendRequest<null, FusionPage>("GET", `/pages/cookbook-page-content`, null, true);
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
   */
  getRecipeDetailsPage(recipeId: string): Promise<FusionPage> {
    return this.http.sendRequest<null, FusionPage>("GET", `/pages/selling-group-details-page?selling_group_id=${encodeURIComponent(recipeId)}`, null, true);
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
