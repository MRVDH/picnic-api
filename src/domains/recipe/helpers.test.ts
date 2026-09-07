import { extractUserDefinedRecipes, extractUserDefinedRecipeDetails, extractIngredientQuantities, extractSuggestedImages } from "./helpers";
import { FusionPage } from "../../types/fusion";

const page = (body: unknown): FusionPage => ({ script: {}, layout: { id: "p", presentation: { type: "FULL_SCREEN" }, header: null, body } as any });

describe("recipe helpers", () => {
  it("extractUserDefinedRecipes picks tiles from the USER_DEFINED_RECIPES segment only", () => {
    const own = (id: string, name: string) => ({
      analytics: {
        contexts: [
          { data: { recipe_id: id, recipe_image_type: "GALLERY", recipe_name: name }, schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-6-0" },
          { data: { segment_name: "Eigen recepten", segment_type: "USER_DEFINED_RECIPES" }, schema: "iglu:tech.picnic.snowplow.analytics/segment/jsonschema/1-0-0" },
        ],
      },
    });
    const saved = {
      analytics: {
        contexts: [
          { data: { recipe_id: "6a1ee3b78d45fb1080af7898", recipe_name: "Catalog" }, schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-6-0" },
          { data: { segment_name: "Bewaard", segment_type: "SAVED_RECIPES" }, schema: "iglu:tech.picnic.snowplow.analytics/segment/jsonschema/1-0-0" },
        ],
      },
    };

    const result = extractUserDefinedRecipes(page({ children: [own("a".repeat(32), "Kaasplank"), saved, own("a".repeat(32), "Kaasplank"), own("b".repeat(32), "Hamburgers")] }));

    expect(result).toEqual([
      { id: "a".repeat(32), name: "Kaasplank", imageType: "GALLERY" },
      { id: "b".repeat(32), name: "Hamburgers", imageType: "GALLERY" },
    ]);
  });

  it("extractUserDefinedRecipeDetails combines the recipe context, header, owner flag and note", () => {
    const id = "3aa496368575423f9c5ed15e0c0c763e";
    const body = {
      children: [
        { data: { creator_type: "USER", default_portions: 2, is_saved: false, sellable_name: "Avocadopasta" } },
        { data: { description: null, is_recipe_owner: true, name: "Avocadopasta" } },
        {
          data: {
            image_type: "SUGGESTED",
            portions: 4,
            recipe_id: id,
            recipe_name: "Avocadopasta",
            selling_units: [
              { checked: true, ingredient_id: "88c457541b974e8ab682e0a449a2d94c", quantity: 1, selling_unit_id: "s1143210", status: "ACTIVE", swap_type: null },
              { checked: false, ingredient_id: "54edeceb41c04ca78cd06bc6b189aa8b", quantity: 2, selling_unit_id: "s1189145", status: "UNAVAILABLE", swap_type: "SIMILAR" },
            ],
          },
        },
        { editable: false, initialContent: "<p>400g pasta</p>", type: "TEXT_EDITOR" },
      ],
    };

    expect(extractUserDefinedRecipeDetails(id, page(body))).toEqual({
      id,
      name: "Avocadopasta",
      portions: 2,
      displayedPortions: 4,
      creatorType: "USER",
      isRecipeOwner: true,
      isSaved: false,
      imageType: "SUGGESTED",
      ingredients: [
        { ingredientId: "88c457541b974e8ab682e0a449a2d94c", sellingUnitId: "s1143210", quantity: 1, status: "ACTIVE", swapType: null, checked: true },
        { ingredientId: "54edeceb41c04ca78cd06bc6b189aa8b", sellingUnitId: "s1189145", quantity: 2, status: "UNAVAILABLE", swapType: "SIMILAR", checked: false },
      ],
      note: "<p>400g pasta</p>",
    });
  });

  it("extractIngredientQuantities reads requiredAmount per selling unit from sellableContentState", () => {
    const wrapper = {
      type: "STATE_BOUNDARY",
      id: "sellableContentState",
      state: {
        ingredientsState: [
          { ingredientId: "ing-1", sellingUnits: { s1: { sellingUnitId: "s1", requiredAmount: 1 } } },
          { ingredientId: "ing-2", sellingUnits: { s2: { sellingUnitId: "s2", requiredAmount: 2 }, s3: { sellingUnitId: "s3", requiredAmount: 5 } } },
        ],
      },
    };
    expect(extractIngredientQuantities({ child: wrapper })).toEqual({ "ing-1": { s1: 1 }, "ing-2": { s2: 2, s3: 5 } });
  });

  it("extractSuggestedImages reads referenceImagesById from ImageSelectionState", () => {
    const first = { id: "1".repeat(64), namespace: "recipes", primary_image: true, rank_value: 1, sellable_id: "69738f92ca0c63178b4a67a9", type: "GALLERY" };
    const second = { id: "2".repeat(64), namespace: "recipes", primary_image: true, rank_value: 10, sellable_id: "6a1ee3b78d45fb1080af7898", type: "GALLERY" };
    const layout = {
      body: {
        children: [
          { type: "STATE_BOUNDARY", id: "GlobalState", state: {} },
          { type: "STATE_BOUNDARY", id: "ImageSelectionState", state: { composedImage: { isLoading: false, url: null }, referenceImagesById: { [first.id]: first, [second.id]: second } } },
        ],
      },
    };

    expect(extractSuggestedImages(layout)).toEqual([
      { id: first.id, referenceImage: first },
      { id: second.id, referenceImage: second },
    ]);
    expect(extractSuggestedImages({ body: {} })).toEqual([]);
  });

  it("extractUserDefinedRecipeDetails returns empty defaults when the page has no recipe data", () => {
    const result = extractUserDefinedRecipeDetails("x".repeat(32), page({ children: [] }));
    expect(result.ingredients).toEqual([]);
    expect(result.note).toBeNull();
    expect(result.name).toBe("");
  });
});
