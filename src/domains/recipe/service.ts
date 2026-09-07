import type HttpClient from "../../http-client";
import type {
  RecipeSavingInput,
  AssignSellingGroupInput,
  UpdateSellingGroupPortionsInput,
  RemoveSellingGroupInput,
  UserDefinedRecipeSummary,
  UserDefinedRecipeDetails,
  NewUserDefinedRecipeIngredient,
  UserDefinedRecipeIngredientSource,
  CreateUserDefinedRecipeInput,
  CreateUserDefinedRecipeResult,
  UpdateUserDefinedRecipeNameInput,
  UpdateUserDefinedRecipePortionsInput,
  DeleteUserDefinedRecipeInput,
  AddUserDefinedRecipeIngredientInput,
  AddUserDefinedRecipeIngredientResult,
  UpdateUserDefinedRecipeIngredientInput,
  UpdateUserDefinedRecipeIngredientResult,
  RemoveUserDefinedRecipeIngredientInput,
  UpdateUserDefinedRecipeNoteInput,
  DeleteUserDefinedRecipeNoteInput,
  SelectUserDefinedRecipeImageInput,
  UserDefinedRecipeImageUpload,
  UserDefinedRecipeImageUploadResult,
} from "./types";
import { FusionPage, FusionPageLayout } from "../../types/fusion";
import { extractUserDefinedRecipes, extractUserDefinedRecipeDetails, extractIngredientQuantities } from "./helpers";

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

  // ─── User defined (custom) recipes ──────────────────────────────────────────
  //
  // The user's own recipes are "user defined recipes" (UDR): selling groups
  // with `creator_type: "USER"` and a 32-hex-character id. Their routes are not
  // declared in the app binary; they were extracted from the PML expressions of
  // the pages listed in `types.ts`. All mutations are `POST /pages/task/<id>`.

  /**
   * Lists the user's own (user defined) recipes.
   * Fetches the cookbook page and extracts the tiles of the `USER_DEFINED_RECIPES`
   * ("Eigen recepten") segment.
   */
  async getUserDefinedRecipes(): Promise<UserDefinedRecipeSummary[]> {
    const page = await this.getCookbookPage();
    return extractUserDefinedRecipes(page);
  }

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
  async getUserDefinedRecipe(recipeId: string): Promise<UserDefinedRecipeDetails> {
    const page = await this.getRecipeDetailsPage(recipeId);
    const details = extractUserDefinedRecipeDetails(recipeId, page);

    if (details.portions > 0 && details.displayedPortions !== details.portions) {
      const wrapper = await this.http.sendRequest<null, unknown>(
        "GET",
        `/pages/selling-group-content-wrapper?portions=${details.portions}&selling_group_creator_type=${encodeURIComponent(details.creatorType)}&selling_group_id=${encodeURIComponent(recipeId)}`,
        null,
        true,
      );
      const quantities = extractIngredientQuantities(wrapper);
      for (const ingredient of details.ingredients) {
        const amount = quantities[ingredient.ingredientId]?.[ingredient.sellingUnitId];
        if (typeof amount === "number") ingredient.quantity = amount;
      }
    }

    return details;
  }

  /**
   * Returns the image selection page for a user defined recipe, listing the
   * suggested images the user can pick from with {@link selectUserDefinedRecipeImage}.
   * Unlike most pages this route returns the bare page layout without the `{ script, layout }` envelope.
   * @param {string} recipeId The recipe id.
   */
  getUserDefinedRecipeImageSelectionPage(recipeId: string): Promise<FusionPageLayout> {
    return this.http.sendRequest<null, FusionPageLayout>(
      "GET",
      `/pages/sellable-image-selection-page-root?origin=RECIPE_DETAILS&sellable_id=${encodeURIComponent(recipeId)}`,
      null,
      true,
    );
  }

  /**
   * Creates a new user defined recipe.
   * Mirrors the "Lijstje opslaan" button of `user-defined-recipe-root`, which posts
   * to `create-user-defined-recipe` and receives the new `sellingGroupId`.
   * @param {string} name The recipe name (the app limits it to 43 characters).
   * @param {NewUserDefinedRecipeIngredient[]} ingredients The products to include.
   * @param {number} [portions=4] Default number of portions the quantities are based on.
   */
  createUserDefinedRecipe(name: string, ingredients: NewUserDefinedRecipeIngredient[], portions: number = 4): Promise<CreateUserDefinedRecipeResult> {
    const sellingUnits = ingredients.map((ingredient) => ingredient.sellingUnitId);
    const quantities: Record<string, number> = {};
    const sources: Record<string, UserDefinedRecipeIngredientSource> = {};
    for (const ingredient of ingredients) {
      quantities[ingredient.sellingUnitId] = ingredient.quantity ?? 1;
      sources[ingredient.sellingUnitId] = ingredient.source ?? "search";
    }

    return this.http.sendRequest<CreateUserDefinedRecipeInput, CreateUserDefinedRecipeResult>(
      "POST",
      `/pages/task/create-user-defined-recipe`,
      {
        payload: {
          name,
          portions,
          selling_unit_quantities_by_id: quantities,
          selling_unit_sources: sources,
          selling_units: sellingUnits,
        },
      },
      true,
    );
  }

  /**
   * Renames a user defined recipe.
   * @param {string} recipeId The recipe id.
   * @param {string} name The new name (the app limits it to 43 characters).
   */
  renameUserDefinedRecipe(recipeId: string, name: string): Promise<Record<string, never>> {
    return this.http.sendRequest<UpdateUserDefinedRecipeNameInput, Record<string, never>>(
      "POST",
      `/pages/task/update-name-user-defined-recipe`,
      { payload: { name, selling_group_id: recipeId } },
      true,
    );
  }

  /**
   * Changes the default number of portions of a user defined recipe.
   * @param {string} recipeId The recipe id.
   * @param {number} portions The new default number of portions.
   */
  updateUserDefinedRecipePortions(recipeId: string, portions: number): Promise<Record<string, never>> {
    return this.http.sendRequest<UpdateUserDefinedRecipePortionsInput, Record<string, never>>(
      "POST",
      `/pages/task/update-portions-user-defined-recipe`,
      { payload: { portions, sellable_id: recipeId } },
      true,
    );
  }

  /**
   * Deletes a user defined recipe and all its ingredients.
   * The app follows this with `remove-sellable-context-from-basket` for the same
   * `sellable_id` when the recipe is in the basket; call
   * {@link removeSellingGroupFromBasket} first if you need that behaviour.
   * @param {string} recipeId The recipe id.
   */
  deleteUserDefinedRecipe(recipeId: string): Promise<Record<string, never>> {
    return this.http.sendRequest<DeleteUserDefinedRecipeInput, Record<string, never>>(
      "POST",
      `/pages/task/delete-user-defined-sellable`,
      { payload: { sellable_id: recipeId } },
      true,
    );
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
  addUserDefinedRecipeIngredient(recipeId: string, sellingUnitId: string, quantity: number = 1, portions: number = 4, order: number = 0): Promise<AddUserDefinedRecipeIngredientResult> {
    return this.http.sendRequest<AddUserDefinedRecipeIngredientInput, AddUserDefinedRecipeIngredientResult>(
      "POST",
      `/pages/task/add-ingredient-task`,
      {
        payload: {
          order: String(order),
          quantity,
          requested_portions: String(portions),
          selling_group_id: recipeId,
          selling_unit_id: sellingUnitId,
        },
      },
      true,
    );
  }

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
  updateUserDefinedRecipeIngredient(recipeId: string, ingredientId: string, sellingUnitQuantities: Record<string, number>, portions: number = 4, swapType?: string | null): Promise<UpdateUserDefinedRecipeIngredientResult> {
    return this.http.sendRequest<UpdateUserDefinedRecipeIngredientInput, UpdateUserDefinedRecipeIngredientResult>(
      "POST",
      `/pages/task/save-selling-group-edit-task`,
      {
        payload: {
          requested_sellable_portions: String(portions),
          selling_group_component_id: ingredientId,
          selling_group_id: recipeId,
          selling_unit_quantity_by_id: sellingUnitQuantities,
          swapType: swapType ?? undefined,
        },
      },
      true,
    );
  }

  /**
   * Removes an ingredient from a user defined recipe.
   * @param {string} recipeId The recipe id.
   * @param {string} ingredientId The ingredient (selling group component) id.
   */
  removeUserDefinedRecipeIngredient(recipeId: string, ingredientId: string): Promise<Record<string, never>> {
    return this.http.sendRequest<RemoveUserDefinedRecipeIngredientInput, Record<string, never>>(
      "POST",
      `/pages/task/delete-selling-group-component`,
      { payload: { selling_group_component_id: ingredientId, selling_group_id: recipeId } },
      true,
    );
  }

  /**
   * Sets (creates or replaces) the free-text note of a user defined recipe.
   * The note is HTML as produced by the app's editor, e.g. `<p>400g pasta</p><p>Kook de pasta.</p>`.
   * The app rejects notes whose text content exceeds 5000 characters.
   * @param {string} recipeId The recipe id.
   * @param {string} note The note as HTML.
   */
  setUserDefinedRecipeNote(recipeId: string, note: string): Promise<Record<string, never>> {
    return this.http.sendRequest<UpdateUserDefinedRecipeNoteInput, Record<string, never>>(
      "POST",
      `/pages/task/update-selling-group-note`,
      { payload: { note, selling_group_id: recipeId } },
      true,
    );
  }

  /**
   * Deletes the note of a user defined recipe.
   * @param {string} recipeId The recipe id.
   */
  deleteUserDefinedRecipeNote(recipeId: string): Promise<Record<string, never>> {
    return this.http.sendRequest<DeleteUserDefinedRecipeNoteInput, Record<string, never>>(
      "POST",
      `/pages/task/delete-selling-group-note-task`,
      { payload: { selling_group_id: recipeId } },
      true,
    );
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
  async uploadUserDefinedRecipeImage(recipeId: string, image: UserDefinedRecipeImageUpload): Promise<UserDefinedRecipeImageUploadResult> {
    const type = (image.type ?? "image/jpeg").replace(/jpg/gi, "jpeg");
    const body = image.data instanceof Blob ? image.data : image.data instanceof ArrayBuffer ? new Uint8Array(image.data) : Uint8Array.from(image.data as Uint8Array);

    const response = await fetch(`${this.http.url}/user-defined-sellable/${encodeURIComponent(recipeId)}`, {
      method: "POST",
      headers: { ...this.http.baseHeaders, ...this.http.picnicHeaders, "Content-Type": type },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      let message = response.statusText;
      try {
        message = (JSON.parse(text) as { error?: { message?: string } }).error?.message || message;
      } catch {
        // not JSON
      }
      throw new Error(`Image upload failed: ${response.status} ${message}`);
    }

    return (await response.json()) as UserDefinedRecipeImageUploadResult;
  }

  /**
   * Sets the image of a user defined recipe, either a suggested image from
   * {@link getUserDefinedRecipeImageSelectionPage} or a photo uploaded with
   * {@link uploadUserDefinedRecipeImage}.
   * @param {string} recipeId The recipe id.
   * @param {string} imageId The image id to select.
   * @param {unknown} [referenceImage] Reference image metadata, for suggested images.
   */
  selectUserDefinedRecipeImage(recipeId: string, imageId: string, referenceImage?: unknown): Promise<Record<string, never>> {
    return this.http.sendRequest<SelectUserDefinedRecipeImageInput, Record<string, never>>(
      "POST",
      `/pages/task/select-sellable-image`,
      {
        payload: {
          sellable_id: recipeId,
          selected_image_id: imageId,
          ...(referenceImage !== undefined && { reference_image: referenceImage }),
        },
      },
      true,
    );
  }
}
