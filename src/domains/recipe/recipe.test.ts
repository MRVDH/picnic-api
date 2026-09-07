import { RecipeService } from "./service";
import HttpClient from "../../http-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

let recipe: RecipeService;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, body: {}, json: () => Promise.resolve({}) });
  recipe = new RecipeService(new HttpClient({ authKey: "initial-auth-key" }));
});

describe("RecipeService", () => {
  it("getRecipeDetailsPage uses the selling-group-details-page route (not the 404'ing recipe-details-page-root)", async () => {
    await recipe.getRecipeDetailsPage("0123456789abcdef01234567");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/pages/selling-group-details-page?selling_group_id=0123456789abcdef01234567",
      ),
      expect.objectContaining({ method: "GET" }),
    );
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("recipe-details-page-root");
  });

  it("getCookbookPage requests the cookbook content page", async () => {
    await recipe.getCookbookPage();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pages/cookbook-page-content"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("getRecipesPage requests the meal-planner root", async () => {
    await recipe.getRecipesPage();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pages/meals-page-root"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  describe("structured recipe reads", () => {
    const recipeId = "recipe-id";
    const response = (data: unknown) => ({ ok: true, body: {}, json: async () => data });
    const detailsPage = (portions: number, defaultPortions: number, productId: string, name: string | null = null, creatorType = "PIM") => ({
      script: {}, layout: { body: { children: [
        { data: { creator_type: creatorType, default_portions: defaultPortions, is_saved: true, sellable_name: "Recipe" } },
        { data: { recipe_id: recipeId, recipe_name: "Recipe", portions, selling_units: [
          { ingredient_id: "ingredient", selling_unit_id: productId, quantity: portions === 4 ? 1 : 2, checked: true },
        ] } },
        { id: "selling-group-details-image", type: "PML", pml: { component: { type: "IMAGE", source: { id: `recipes/image-${portions}` } } } },
        ...(name ? [{ type: "PML", id: "core-wide-selling-unit-tile-ingredient", analytics: { contexts: [
          { schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-6-0", data: { selling_units: [{ ingredient_id: "ingredient", selling_unit_id: productId }] } },
        ] }, pml: { component: { type: "RICH_TEXT", textType: "SUBTITLE1", markdown: name } } }] : []),
      ] } },
    });

    it.each(["PIM", "USER"])("refetches all data at default portions for %s when product IDs change", async (creator) => {
      mockFetch.mockResolvedValueOnce(response(detailsPage(2, 4, "small-pack", "Small pack", creator)));
      mockFetch.mockResolvedValueOnce(response(detailsPage(4, 4, "large-pack", "Large pack", creator)));
      const details = creator === "USER" ? await recipe.getUserDefinedRecipe(recipeId) : await recipe.getRecipe(recipeId);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toContain(`/pages/selling-group-details-page?selling_group_id=${recipeId}&portions=4`);
      expect(details).toMatchObject({ portions: 4, defaultPortions: 4, displayedPortions: 4, imageId: "recipes/image-4" });
      expect(details.ingredients[0]).toMatchObject({ sellingUnitId: "large-pack", name: "Large pack", quantity: 1 });
    });

    it.each(["getRecipe", "getUserDefinedRecipe"] as const)("%s requests explicit portions in a single details call", async (method) => {
      mockFetch.mockResolvedValueOnce(response(detailsPage(2, 4, "small-pack")));
      const details = await recipe[method](recipeId, 2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("&portions=2");
      expect(details).toMatchObject({ portions: 2, defaultPortions: 4 });
      expect(details.ingredients[0].name).toBeNull(); // No extra name requests by default.
    });

    it("does not refetch when the default already matches", async () => {
      mockFetch.mockResolvedValueOnce(response(detailsPage(4, 4, "product")));
      await recipe.getRecipe(recipeId);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it.each([0, -1, 1.5, NaN, Infinity])("rejects invalid portions %s before a request", async (portions) => {
      await expect(recipe.getRecipe(recipeId, portions)).rejects.toThrow("positive integer");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("bounds refetching when the server ignores the requested portions", async () => {
      mockFetch.mockResolvedValue(response(detailsPage(2, 4, "product")));
      await expect(recipe.getRecipe(recipeId, 4)).rejects.toThrow("rendered 2 portions instead of 4");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("propagates backend rendering errors without silently using different portions", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error", text: async () => JSON.stringify({ error: { message: "Error rendering page_id='selling-group-details-page'" } }) });
      await expect(recipe.getUserDefinedRecipe(recipeId, 2)).rejects.toThrow("Error rendering page_id='selling-group-details-page'");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("runs optional name lookups concurrently and deduplicates product IDs", async () => {
      const data = detailsPage(4, 4, "first");
      const units = (data.layout.body.children[1] as any).data.selling_units;
      units.push({ ...units[0], ingredient_id: "second", selling_unit_id: "second" }, { ...units[0], ingredient_id: "duplicate" });
      const resolvers: Array<(value: unknown) => void> = [];
      mockFetch.mockResolvedValueOnce(response(data));
      mockFetch.mockImplementation(() => new Promise(resolve => { resolvers.push(resolve); }));
      const pending = recipe.getUserDefinedRecipe(recipeId, undefined, { resolveIngredientNames: true });
      // Wait for the async details parse, while both product requests remain unresolved.
      for (let i = 0; i < 20 && resolvers.length < 2; i++) await Promise.resolve();
      expect(resolvers).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      resolvers.forEach((resolve, index) => resolve(response({ type: "RICH_TEXT", textType: "HEADER1", markdown: `Product ${index}` })));
      const details = await pending;
      expect(details.ingredients.map(i => i.name)).toEqual(["Product 0", "Product 1", "Product 0"]);
    });

    it("propagates errors from explicitly enabled product lookups", async () => {
      mockFetch.mockResolvedValueOnce(response(detailsPage(4, 4, "product")));
      mockFetch.mockRejectedValueOnce(new Error("Product unavailable"));
      await expect(recipe.getRecipe(recipeId, undefined, { resolveIngredientNames: true })).rejects.toThrow("Product unavailable");
    });

    it("returns null if the optional product page has no name", async () => {
      mockFetch.mockResolvedValueOnce(response(detailsPage(4, 4, "product")));
      mockFetch.mockResolvedValueOnce(response({}));
      expect((await recipe.getRecipe(recipeId, undefined, { resolveIngredientNames: true })).ingredients[0].name).toBeNull();
    });

    it.each([["getSavedRecipes", "SAVED_RECIPES"], ["getUserDefinedRecipes", "USER_DEFINED_RECIPES"]] as const)("%s selects the correct cookbook segment", async (method, segment) => {
      const tile = (segmentType: string, id: string) => ({ analytics: { contexts: [
        { schema: "iglu:tech.picnic.snowplow.analytics/segment/jsonschema/1-0-0", data: { segment_type: segmentType } },
        { schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-6-0", data: { recipe_id: id, recipe_name: id } },
      ] } });
      mockFetch.mockResolvedValueOnce(response({ children: [tile(segment, "wanted"), tile("NEW_RECIPES", "other")] }));
      expect(await recipe[method]()).toEqual([{ id: "wanted", name: "wanted", imageType: null }]);
    });
  });

  describe("user defined recipes", () => {
    const recipeId = "3aa496368575423f9c5ed15e0c0c763e";

    const lastCall = () => {
      const [url, init] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      return { url: url as string, init: init as RequestInit, body: JSON.parse(init.body as string) };
    };

    it("createUserDefinedRecipe posts name, portions and ingredient maps to create-user-defined-recipe", async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ sellingGroupId: recipeId }) });

      const result = await recipe.createUserDefinedRecipe("Testrecept", [
        { sellingUnitId: "s1143210", quantity: 2, source: "usuals-suggestion" },
        { sellingUnitId: "s1189145" },
      ], 4);

      const { url, init, body } = lastCall();
      expect(url).toContain("/pages/task/create-user-defined-recipe");
      expect(init.method).toBe("POST");
      expect(body).toEqual({
        payload: {
          name: "Testrecept",
          portions: 4,
          selling_unit_quantities_by_id: { s1143210: 2, s1189145: 1 },
          selling_unit_sources: { s1143210: "usuals-suggestion", s1189145: "search" },
          selling_units: ["s1143210", "s1189145"],
        },
      });
      expect(result.sellingGroupId).toBe(recipeId);
    });

    it("renameUserDefinedRecipe posts to update-name-user-defined-recipe", async () => {
      await recipe.renameUserDefinedRecipe(recipeId, "Nieuwe naam");
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/update-name-user-defined-recipe");
      expect(body).toEqual({ payload: { name: "Nieuwe naam", selling_group_id: recipeId } });
    });

    it("updateUserDefinedRecipePortions posts to update-portions-user-defined-recipe", async () => {
      await recipe.updateUserDefinedRecipePortions(recipeId, 6);
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/update-portions-user-defined-recipe");
      expect(body).toEqual({ payload: { portions: 6, sellable_id: recipeId } });
    });

    it("deleteUserDefinedRecipe posts to delete-user-defined-sellable", async () => {
      await recipe.deleteUserDefinedRecipe(recipeId);
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/delete-user-defined-sellable");
      expect(body).toEqual({ payload: { sellable_id: recipeId } });
    });

    it("addUserDefinedRecipeIngredient sends order and portions as strings like the app", async () => {
      await recipe.addUserDefinedRecipeIngredient(recipeId, "s1010706", 1, 4, 7);
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/add-ingredient-task");
      expect(body).toEqual({
        payload: { order: "7", quantity: 1, requested_portions: "4", selling_group_id: recipeId, selling_unit_id: "s1010706" },
      });
    });

    it("updateUserDefinedRecipeIngredient posts to save-selling-group-edit-task", async () => {
      await recipe.updateUserDefinedRecipeIngredient(recipeId, "88c457541b974e8ab682e0a449a2d94c", { s1143210: 2 }, 4);
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/save-selling-group-edit-task");
      expect(body).toEqual({
        payload: {
          requested_sellable_portions: "4",
          selling_group_component_id: "88c457541b974e8ab682e0a449a2d94c",
          selling_group_id: recipeId,
          selling_unit_quantity_by_id: { s1143210: 2 },
        },
      });
    });

    it("removeUserDefinedRecipeIngredient posts to delete-selling-group-component", async () => {
      await recipe.removeUserDefinedRecipeIngredient(recipeId, "88c457541b974e8ab682e0a449a2d94c");
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/delete-selling-group-component");
      expect(body).toEqual({ payload: { selling_group_component_id: "88c457541b974e8ab682e0a449a2d94c", selling_group_id: recipeId } });
    });

    it("setUserDefinedRecipeNote and deleteUserDefinedRecipeNote use the note tasks", async () => {
      await recipe.setUserDefinedRecipeNote(recipeId, "<p>Kook de pasta.</p>");
      expect(lastCall().url).toContain("/pages/task/update-selling-group-note");
      expect(lastCall().body).toEqual({ payload: { note: "<p>Kook de pasta.</p>", selling_group_id: recipeId } });

      await recipe.deleteUserDefinedRecipeNote(recipeId);
      expect(lastCall().url).toContain("/pages/task/delete-selling-group-note-task");
      expect(lastCall().body).toEqual({ payload: { selling_group_id: recipeId } });
    });

    it("updateUserDefinedRecipeIngredient includes the swap type when given", async () => {
      await recipe.updateUserDefinedRecipeIngredient(recipeId, "88c457541b974e8ab682e0a449a2d94c", { s1143210: 0, s1189145: 1 }, 2, "SEARCH_SELECTION");
      const { body } = lastCall();
      expect(body.payload.swapType).toBe("SEARCH_SELECTION");
      expect(body.payload.selling_unit_quantity_by_id).toEqual({ s1143210: 0, s1189145: 1 });
    });

    it("assignSellableComponentToDay posts the selection with portions as a string", async () => {
      await recipe.assignSellableComponentToDay(recipeId, "88c457541b974e8ab682e0a449a2d94c", { s1189145: 1 }, 2, "SEARCH_SELECTION");
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/assign-sellable-component-to-day");
      expect(body).toEqual({
        payload: {
          component_swap_type: "SEARCH_SELECTION",
          portions: "2",
          required_amount_by_selling_unit_id: { s1189145: 1 },
          selected_component_id: "88c457541b974e8ab682e0a449a2d94c",
          selling_group_id: recipeId,
        },
      });
    });

    it("getUserDefinedRecipeSuggestedImages extracts the reference images from the selection page", async () => {
      const reference = { id: "a".repeat(64), namespace: "recipes", primary_image: true, rank_value: 1, sellable_id: "69738f92ca0c63178b4a67a9", type: "GALLERY" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "sellable-image-selection-page-root", body: { children: [{ type: "STATE_BOUNDARY", id: "ImageSelectionState", state: { referenceImagesById: { [reference.id]: reference } } }] } }),
      });

      const images = await recipe.getUserDefinedRecipeSuggestedImages(recipeId);

      expect(lastCall().url).toContain(`/pages/sellable-image-selection-page-root?origin=RECIPE_DETAILS&sellable_id=${recipeId}`);
      expect(images).toEqual([{ id: reference.id, referenceImage: reference }]);
    });

    it("selectUserDefinedRecipeImage posts to select-sellable-image", async () => {
      await recipe.selectUserDefinedRecipeImage(recipeId, "img-1");
      const { url, body } = lastCall();
      expect(url).toContain("/pages/task/select-sellable-image");
      expect(body).toEqual({ payload: { sellable_id: recipeId, selected_image_id: "img-1" } });
    });

    it("uploadUserDefinedRecipeImage posts the raw bytes with the image content type", async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ image_id: "img-1", namespace: "sellable-customer-uploaded" }) });

      const result = await recipe.uploadUserDefinedRecipeImage(recipeId, { data: new Uint8Array([1, 2, 3]), type: "image/jpg" });

      const [url, init] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(url).toContain(`/user-defined-sellable/${recipeId}`);
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(Uint8Array);
      const headers = init.headers as Headers;
      expect(headers.get("Content-Type")).toBe("image/jpeg");
      expect(headers.get("x-picnic-auth")).toBe("initial-auth-key");
      expect(headers.get("x-picnic-agent")).not.toBeNull();
      expect(result.image_id).toBe("img-1");
    });
  });
});
