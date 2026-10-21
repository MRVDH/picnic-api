import type HttpClient from "../../http-client";
import type {
  RecipeCategory,
  RecipeCategoryGroup,
  RecipeOverview,
  RecipeSavingInput,
  RecipeSummary,
  Recipe,
  RecipeOptions,
  AddRecipeToCartOptions,
  RecipePortionsInCart,
  RecipeIngredientSelection,
  RecipeIngredientCartSelection,
  NewIngredientOptions,
  AddRecipeToCartInput,
  UpdateRecipePortionsInCartInput,
  RemoveRecipeFromCartInput,
  RawAddRecipeToCartResult,
  RawRemoveRecipeFromCartResult,
  NewUserDefinedRecipeIngredient,
  UserDefinedRecipeIngredientSource,
  CreateUserDefinedRecipeInput,
  RawCreateUserDefinedRecipeResult,
  UpdateUserDefinedRecipeNameInput,
  UpdateUserDefinedRecipePortionsInput,
  DeleteUserDefinedRecipeInput,
  AddUserDefinedRecipeIngredientInput,
  RawAddUserDefinedRecipeIngredientResult,
  UpdateRecipeIngredientInput,
  RawUpdateRecipeIngredientResult,
  RemoveRecipeIngredientInput,
  RawRemoveRecipeIngredientResult,
  UpdateRecipeIngredientInCartInput,
  RawUpdateRecipeIngredientInCartResult,
  UserDefinedRecipeReferenceImage,
  UserDefinedRecipeSuggestedImage,
  UpdateUserDefinedRecipeNoteInput,
  DeleteUserDefinedRecipeNoteInput,
  SelectUserDefinedRecipeImageInput,
  UserDefinedRecipeImageUpload,
  RawUserDefinedRecipeImageUploadResult,
} from "./types";
import { FusionPage, FusionPageLayout } from "../../pages/fusion";
import type { PageClient } from "../../pages/page-client";
import { productDetailsPageId } from "../catalog/product";
import { extractRecipes, extractRecipeDetails, extractIngredientProductName, extractSuggestedImages } from "./recipe";
import { extractRecipeCategory, extractRecipeCategoryGroup, extractRecipeOverview, extractRecipeTiles } from "./lists";

export class RecipeService {
  constructor(
    private http: HttpClient,
    private pages: PageClient,
  ) {}

  /** Fetches the cookbook home (`meals-page-root`, Fusion). */
  private getRecipesPage(): Promise<FusionPage> {
    return this.pages.getFusionPage("meals-page-root");
  }

  /**
   * Fetches the cookbook page (`cookbook-page-content`, Fusion), which lists the user's recipes
   * grouped by segment. Each recipe tile carries a `segment_type` analytics context, e.g.
   * `SAVED_RECIPES`, `USER_DEFINED_RECIPES` (the user's own recipes), `NEW_RECIPES`.
   */
  private getCookbookPage(): Promise<FusionPage> {
    return this.pages.getFusionPage("cookbook-page-content");
  }

  /**
   * Fetches the detail page of a recipe (Fusion). Recipes are "selling groups", so the page is
   * `selling-group-details-page` with the recipe id as `selling_group_id`.
   * @param {string} recipeId The recipe id (24 hex characters for catalog recipes, 32 for the user's own).
   * @param {number} [portions] Render this many portions; omit to use the app's selection.
   */
  private getRecipeDetailsPage(recipeId: string, portions?: number): Promise<FusionPage> {
    if (portions !== undefined && (!Number.isSafeInteger(portions) || portions <= 0)) {
      throw new RangeError("Recipe portions must be a positive integer");
    }
    const query = portions === undefined ? "" : `&portions=${portions}`;
    return this.pages.getFusionPage(`selling-group-details-page?selling_group_id=${encodeURIComponent(recipeId)}${query}`);
  }

  /**
   * Lists the user's saved recipes, as the app's saved recipes page (`saved-deep-dive-page`)
   * shows them. Use {@link getRecipe} for structured ingredients and other details.
   * Parses dynamic Fusion/PML tiles and may need updates if Picnic changes them.
   */
  async getSavedRecipes(): Promise<RecipeSummary[]> {
    return extractRecipeTiles(await this.pages.getFusionPage("saved-deep-dive-page-content"));
  }

  /**
   * Returns the cookbook home as the app shows it: the rows of recipes (each with its selected
   * filter pill) and the category tree, whose links open {@link getRecipeCategory} and
   * {@link getRecipeCategoryGroup}.
   */
  async getRecipeOverview(): Promise<RecipeOverview> {
    return extractRecipeOverview(await this.getRecipesPage());
  }

  /**
   * Returns the recipes of a category, from the `meals-category-page` RSC page.
   * @param {string} categoryId The `category_id` of a category link from {@link getRecipeOverview}.
   */
  async getRecipeCategory(categoryId: string): Promise<RecipeCategory> {
    const content = await this.pages.getRscContent(`meals-category-page?category_id=${encodeURIComponent(categoryId)}`);
    return extractRecipeCategory(categoryId, content);
  }

  /**
   * Returns the categories of a group, from the `meals-category-group-page` RSC page.
   * @param {string} groupName The `group_name` of a group link from {@link getRecipeOverview}, e.g. "Kids".
   */
  async getRecipeCategoryGroup(groupName: string): Promise<RecipeCategoryGroup> {
    const content = await this.pages.getRscContent(`meals-category-group-page?group_name=${encodeURIComponent(groupName)}`);
    return extractRecipeCategoryGroup(groupName, content);
  }

  /**
   * Returns structured catalog or user-defined recipe details at the requested
   * portions, or, when omitted, at the count Picnic renders the page with (as the
   * app shows it). If the page renders a different count than requested, refetches
   * it once so names, product ids and quantities come from the same response.
   * Products may change with the portion count. `defaultPortions` is the recipe's
   * stored count (for catalog recipes, the portions of the original recipe);
   * `portions` describes the result.
   *
   * Includes the steps, times, nutrition and allergens, and per ingredient the
   * product, prices and allergens shown on the page. Ingredient names come from
   * recipe tiles. Set `resolveIngredientNames` to true to fetch missing names from
   * product pages concurrently; otherwise they remain null. These extra requests can
   * fail the call. Quantities are selling-unit counts, not weights or volumes. The
   * image id includes its namespace.
   *
   * Parses dynamic Fusion/PML and may need updates when Picnic changes its pages.
   * The backend can briefly fail after mutations; deleted recipes fail persistently.
   * Some recipes reject particular portion counts with a page-rendering error.
   * @param {string} recipeId The selling group id of either kind of recipe.
   * @param {RecipeOptions} [options] The portions, and whether to look up missing ingredient names.
   */
  async getRecipe(recipeId: string, options: RecipeOptions = {}): Promise<Recipe> {
    const { portions } = options;
    let details = extractRecipeDetails(recipeId, await this.getRecipeDetailsPage(recipeId, portions));
    if (portions !== undefined && details.portions !== portions) {
      details = extractRecipeDetails(recipeId, await this.getRecipeDetailsPage(recipeId, portions));
      if (details.portions !== portions) {
        throw new Error(`Recipe ${recipeId} rendered ${details.portions} portions instead of ${portions}`);
      }
    }

    if (options.resolveIngredientNames) {
      const names = new Map<string, Promise<string | null>>();
      await Promise.all(details.ingredients.map(async (ingredient) => {
        if (ingredient.name !== null || !ingredient.sellingUnitId) return;
        let name = names.get(ingredient.sellingUnitId);
        if (!name) {
          name = this.pages.getFusionPage(productDetailsPageId(ingredient.sellingUnitId)).then(extractIngredientProductName);
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
  saveRecipe(recipeId: string): Promise<void> {
    return this.http.sendRequest<RecipeSavingInput, void>(
      "POST",
      `/pages/task/recipe-saving`,
      {
        payload: {
          recipe_id: recipeId,
          saved_at: new Date().toISOString(),
        },
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Removes a recipe from the user's saved recipes list.
   * Sends `null` as `saved_at` to mark the recipe as unsaved.
   * @param {string} recipeId The id of the recipe to unsave.
   */
  unsaveRecipe(recipeId: string): Promise<void> {
    return this.http.sendRequest<RecipeSavingInput, void>(
      "POST",
      `/pages/task/recipe-saving`,
      {
        payload: {
          recipe_id: recipeId,
          saved_at: null,
        },
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Adds a recipe's ingredients to the cart, planned for a delivery day.
   * @param {string} recipeId The recipe id.
   * @param {AddRecipeToCartOptions} [options] The delivery day and the number of portions.
   */
  addRecipeToCart(recipeId: string, options: AddRecipeToCartOptions = {}): Promise<RawAddRecipeToCartResult> {
    const { dayOffset, portions } = options;
    return this.http.sendRequest<AddRecipeToCartInput, RawAddRecipeToCartResult>(
      "POST",
      `/pages/task/assign-selling-group-to-basket`,
      {
        payload: {
          selling_group_id: recipeId,
          ...(dayOffset !== undefined && { day_offset: dayOffset }),
          ...(portions !== undefined && { portions }),
        },
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Changes the number of portions of a recipe that is in the cart.
   * @param {string} recipeId The recipe id.
   * @param {RecipePortionsInCart} planned The delivery day the recipe is planned for and the new number of portions.
   */
  updateRecipePortionsInCart(recipeId: string, planned: RecipePortionsInCart): Promise<void> {
    const { dayOffset, portions } = planned;
    return this.http.sendRequest<UpdateRecipePortionsInCartInput, void>(
      "POST",
      `/pages/task/update-selling-group-number-of-portions-task`,
      {
        payload: {
          selling_group_id: recipeId,
          day_offset: dayOffset,
          portions,
        },
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Removes a recipe and its ingredients from the cart.
   * @param {string} recipeId The recipe id.
   */
  removeRecipeFromCart(recipeId: string): Promise<RawRemoveRecipeFromCartResult> {
    return this.http.sendRequest<RemoveRecipeFromCartInput, RawRemoveRecipeFromCartResult>(
      "POST",
      `/pages/task/remove-selling-group-from-basket`,
      {
        payload: {
          selling_group_id: recipeId,
        },
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Updates an ingredient of a recipe, a catalog recipe or a user defined one: change its
   * quantity, or swap the product by passing a different selling unit id. Mirrors the save button
   * of the app's ingredient editor (`selling-group-component-edit-page`). When swapping an
   * ingredient that has more than one selling unit, include each of its current selling unit ids
   * with quantity `0` next to the new selection.
   *
   * A response with `shouldUpdateCart: true` means the recipe is in the cart with a selection
   * that differs from this one; call {@link updateRecipeIngredientInCart} with the same
   * selection to update the cart.
   * @param {string} recipeId The recipe id.
   * @param {string} ingredientId The ingredient (selling group component) id.
   * @param {RecipeIngredientSelection} selection The quantities, the portions they're for and the swap type.
   */
  updateRecipeIngredient(recipeId: string, ingredientId: string, selection: RecipeIngredientSelection): Promise<RawUpdateRecipeIngredientResult> {
    const { quantities, portions = 4, swapType } = selection;
    return this.http.sendRequest<UpdateRecipeIngredientInput, RawUpdateRecipeIngredientResult>(
      "POST",
      `/pages/task/save-selling-group-edit-task`,
      {
        payload: {
          requested_sellable_portions: String(portions),
          selling_group_component_id: ingredientId,
          selling_group_id: recipeId,
          selling_unit_quantity_by_id: quantities,
          swapType: swapType ?? undefined,
        },
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Puts an updated ingredient selection of a recipe that is in the cart into the cart. The app
   * calls this after {@link updateRecipeIngredient} returned `shouldUpdateCart: true`. The edit
   * task removes the replaced product from the cart; this call adds the new selection, so without
   * it the cart lacks that ingredient.
   * @param {string} recipeId The recipe id.
   * @param {string} ingredientId The ingredient (selling group component) id.
   * @param {RecipeIngredientCartSelection} selection The selected quantities, the portions they're for and the swap type.
   */
  updateRecipeIngredientInCart(recipeId: string, ingredientId: string, selection: RecipeIngredientCartSelection): Promise<RawUpdateRecipeIngredientInCartResult> {
    const { quantities, portions, swapType } = selection;
    return this.http.sendRequest<UpdateRecipeIngredientInCartInput, RawUpdateRecipeIngredientInCartResult>(
      "POST",
      `/pages/task/assign-sellable-component-to-day`,
      {
        payload: {
          component_swap_type: swapType,
          portions: String(portions),
          required_amount_by_selling_unit_id: quantities,
          selected_component_id: ingredientId,
          selling_group_id: recipeId,
        },
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Removes an ingredient from a recipe, a catalog recipe or a user defined one.
   * @param {string} recipeId The recipe id.
   * @param {string} ingredientId The ingredient (selling group component) id.
   */
  removeRecipeIngredient(recipeId: string, ingredientId: string): Promise<RawRemoveRecipeIngredientResult> {
    return this.http.sendRequest<RemoveRecipeIngredientInput, RawRemoveRecipeIngredientResult>(
      "POST",
      `/pages/task/delete-selling-group-component`,
      { payload: { selling_group_component_id: ingredientId, selling_group_id: recipeId } },
      { includePicnicHeaders: true },
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
   * ("Eigen recepten") segment, with the same summary shape as {@link getSavedRecipes}.
   */
  async getUserDefinedRecipes(): Promise<RecipeSummary[]> {
    return extractRecipes(await this.getCookbookPage(), "USER_DEFINED_RECIPES");
  }

  /**
   * Fetches the image selection page of a user defined recipe (Fusion). Unlike most pages it
   * returns the bare page layout without the `{ script, layout }` envelope.
   */
  private getUserDefinedRecipeImageSelectionPage(recipeId: string): Promise<FusionPageLayout> {
    return this.pages.getFusionPage<FusionPageLayout>(`sellable-image-selection-page-root?origin=RECIPE_DETAILS&sellable_id=${encodeURIComponent(recipeId)}`);
  }

  /**
   * Returns the suggested images for a user defined recipe, from the app's image selection page
   * (`sellable-image-selection-page-root`). Pass an entry's `id` and
   * `referenceImage` to {@link selectUserDefinedRecipeImage}.
   * @param {string} recipeId The recipe id.
   */
  async getUserDefinedRecipeSuggestedImages(recipeId: string): Promise<UserDefinedRecipeSuggestedImage[]> {
    const page = await this.getUserDefinedRecipeImageSelectionPage(recipeId);
    return extractSuggestedImages(page);
  }

  /**
   * Creates a new user defined recipe.
   * Mirrors the "Lijstje opslaan" button of `user-defined-recipe-root`, which posts
   * to `create-user-defined-recipe` and receives the new `recipeId`.
   * @param {string} name The recipe name (the app limits it to 43 characters).
   * @param {NewUserDefinedRecipeIngredient[]} ingredients The products to include.
   * @param {number} [portions=4] Default number of portions the quantities are based on.
   */
  createUserDefinedRecipe(name: string, ingredients: NewUserDefinedRecipeIngredient[], portions: number = 4): Promise<RawCreateUserDefinedRecipeResult> {
    const sellingUnits = ingredients.map((ingredient) => ingredient.sellingUnitId);
    const quantities: Record<string, number> = {};
    const sources: Record<string, UserDefinedRecipeIngredientSource> = {};
    for (const ingredient of ingredients) {
      quantities[ingredient.sellingUnitId] = ingredient.quantity ?? 1;
      sources[ingredient.sellingUnitId] = ingredient.source ?? "search";
    }

    return this.http.sendRequest<CreateUserDefinedRecipeInput, RawCreateUserDefinedRecipeResult>(
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
      { includePicnicHeaders: true },
    );
  }

  /**
   * Renames a user defined recipe.
   * @param {string} recipeId The recipe id.
   * @param {string} name The new name (the app limits it to 43 characters).
   */
  renameUserDefinedRecipe(recipeId: string, name: string): Promise<void> {
    return this.http.sendRequest<UpdateUserDefinedRecipeNameInput, void>(
      "POST",
      `/pages/task/update-name-user-defined-recipe`,
      { payload: { name, selling_group_id: recipeId } },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Changes the default number of portions of a user defined recipe.
   * @param {string} recipeId The recipe id.
   * @param {number} portions The new default number of portions.
   */
  updateUserDefinedRecipePortions(recipeId: string, portions: number): Promise<void> {
    return this.http.sendRequest<UpdateUserDefinedRecipePortionsInput, void>(
      "POST",
      `/pages/task/update-portions-user-defined-recipe`,
      { payload: { portions, sellable_id: recipeId } },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Deletes a user defined recipe and all its ingredients.
   * The app follows this with `remove-sellable-context-from-basket` for the same
   * `sellable_id` when the recipe is in the basket; call
   * {@link removeRecipeFromCart} first if you need that behaviour.
   * @param {string} recipeId The recipe id.
   */
  deleteUserDefinedRecipe(recipeId: string): Promise<void> {
    return this.http.sendRequest<DeleteUserDefinedRecipeInput, void>(
      "POST",
      `/pages/task/delete-user-defined-sellable`,
      { payload: { sellable_id: recipeId } },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Adds a product as a new ingredient to a user defined recipe.
   * Mirrors the product tiles on the ingredient search page (`page_context=RECIPE_EDITING`).
   * @param {string} recipeId The recipe id.
   * @param {string} sellingUnitId The product (selling unit) id, e.g. `s1143210`.
   * @param {NewIngredientOptions} [options] The quantity, the portions it's for and the position in the list.
   */
  addUserDefinedRecipeIngredient(recipeId: string, sellingUnitId: string, options: NewIngredientOptions = {}): Promise<RawAddUserDefinedRecipeIngredientResult> {
    const { quantity = 1, portions = 4, order = 0 } = options;
    return this.http.sendRequest<AddUserDefinedRecipeIngredientInput, RawAddUserDefinedRecipeIngredientResult>(
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
      { includePicnicHeaders: true },
    );
  }

  /**
   * Sets (creates or replaces) the free-text note of a user defined recipe.
   * The note is HTML as produced by the app's editor, e.g. `<p>400g pasta</p><p>Kook de pasta.</p>`.
   * The app rejects notes whose text content exceeds 5000 characters.
   * @param {string} recipeId The recipe id.
   * @param {string} note The note as HTML.
   */
  setUserDefinedRecipeNote(recipeId: string, note: string): Promise<void> {
    return this.http.sendRequest<UpdateUserDefinedRecipeNoteInput, void>(
      "POST",
      `/pages/task/update-selling-group-note`,
      { payload: { note, selling_group_id: recipeId } },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Deletes the note of a user defined recipe.
   * @param {string} recipeId The recipe id.
   */
  deleteUserDefinedRecipeNote(recipeId: string): Promise<void> {
    return this.http.sendRequest<DeleteUserDefinedRecipeNoteInput, void>(
      "POST",
      `/pages/task/delete-selling-group-note-task`,
      { payload: { selling_group_id: recipeId } },
      { includePicnicHeaders: true },
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
  uploadUserDefinedRecipeImage(recipeId: string, image: UserDefinedRecipeImageUpload): Promise<RawUserDefinedRecipeImageUploadResult> {
    const type = (image.type ?? "image/jpeg").replace(/jpg/gi, "jpeg");
    const body: Blob | Uint8Array<ArrayBuffer> = image.data instanceof Blob ? image.data : new Uint8Array(image.data as ArrayBuffer | Uint8Array);

    return this.http.sendRequest<Blob | Uint8Array, RawUserDefinedRecipeImageUploadResult>(
      "POST",
      `/user-defined-sellable/${encodeURIComponent(recipeId)}`,
      body,
      { includePicnicHeaders: true, contentType: type },
    );
  }

  /**
   * Sets the image of a user defined recipe, either a suggested image from
   * {@link getUserDefinedRecipeSuggestedImages} or a photo uploaded with
   * {@link uploadUserDefinedRecipeImage}.
   * @param {string} recipeId The recipe id.
   * @param {string} imageId The image id to select.
   * @param {UserDefinedRecipeReferenceImage} [referenceImage] Reference image metadata, for suggested images (see {@link getUserDefinedRecipeSuggestedImages}).
   */
  selectUserDefinedRecipeImage(recipeId: string, imageId: string, referenceImage?: UserDefinedRecipeReferenceImage): Promise<void> {
    return this.http.sendRequest<SelectUserDefinedRecipeImageInput, void>(
      "POST",
      `/pages/task/select-sellable-image`,
      {
        payload: {
          sellable_id: recipeId,
          selected_image_id: imageId,
          ...(referenceImage !== undefined && { reference_image: referenceImage }),
        },
      },
      { includePicnicHeaders: true },
    );
  }
}
