import { extractRecipes, extractRecipeDetails, extractUserDefinedRecipes, extractUserDefinedRecipeDetails, extractIngredientQuantities, extractSuggestedImages } from "./helpers";
import { FusionPage } from "../../pages/fusion";

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

    expect(result).toMatchObject([
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

    expect(extractUserDefinedRecipeDetails(id, page(body))).toMatchObject({
      id,
      name: "Avocadopasta",
      portions: 4,
      defaultPortions: 2,
      displayedPortions: 4,
      creatorType: "USER",
      isRecipeOwner: true,
      isSaved: false,
      imageType: "SUGGESTED",
      imageId: null,
      ingredients: [
        { ingredientId: "88c457541b974e8ab682e0a449a2d94c", name: null, sellingUnitId: "s1143210", quantity: 1, status: "ACTIVE", swapType: null, checked: true },
        { ingredientId: "54edeceb41c04ca78cd06bc6b189aa8b", name: null, sellingUnitId: "s1189145", quantity: 2, status: "UNAVAILABLE", swapType: "SIMILAR", checked: false },
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

  it("rejects a details page without a recipe context", () => {
    expect(() => extractUserDefinedRecipeDetails("missing", page({ children: [] }))).toThrow("recipe context missing");
  });

  it("extracts saved tile titles when analytics omit the name, deduplicating tiles", () => {
    const tile = {
      analytics: { contexts: [
        { schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-6-0", data: { recipe_id: "saved" } },
        { schema: "iglu:tech.picnic.snowplow.analytics/segment/jsonschema/1-0-0", data: { segment_type: "SAVED_RECIPES" } },
      ] },
      pml: { component: { type: "RICH_TEXT", textType: "SUBTITLE1", markdown: "#(#333333)**Pasta**#(#333333)" } },
    };
    expect(extractRecipes(page({ children: [tile, tile] }), "SAVED_RECIPES")).toMatchObject([
      { id: "saved", name: "Pasta", imageType: null },
    ]);
    expect(extractRecipes(page(tile), "USER_DEFINED_RECIPES")).toEqual([]);
  });

  it.each(["recipes/catalog-photo", "sellable-customer-uploaded/own-photo"])("extracts the main image %s without picking ingredient images", (imageId) => {
    const id = "recipe";
    const result = extractRecipeDetails(id, page({ children: [
      { type: "IMAGE", source: { id: "articles/ingredient-photo" } },
      { id: "selling-group-details-image", pml: { component: { type: "IMAGE", source: { id: imageId } } } },
      { data: { recipe_id: id, recipe_name: "Recipe", portions: 2, selling_units: [] } },
    ] }));
    expect(result.imageId).toBe(imageId);
  });

  it("preserves discontinued ingredients and extracts names without executing PML", () => {
    const ingredientId = "a".repeat(32);
    const result = extractRecipeDetails("recipe", page({ children: [
      { data: { recipe_id: "recipe", recipe_name: "Recipe", portions: 2, selling_units: [
        { ingredient_id: ingredientId, selling_unit_id: "", quantity: 0, checked: false },
      ] } },
      { type: "PML", id: "core-wide-selling-unit-tile-unsellable-0", pml: {
        component: { type: "RICH_TEXT", textType: "SUBTITLE1", markdown: "Old product" },
        expression: `throw new Error("Do not execute"); // ingredient_id=${ingredientId}&is_udr=true`,
      } },
    ] }));
    expect(result.ingredients[0]).toMatchObject({ name: "Old product", sellingUnitId: "", quantity: 0, checked: false });
  });

  it("returns no image ID when the recipe image is hidden", () => {
    const result = extractRecipeDetails("recipe", page({ children: [
      { id: "selling-group-details-image-hidden", type: "BLOCK", children: [] },
      { type: "IMAGE", source: { id: "articles/product-image" } },
      { data: { recipe_id: "recipe", recipe_name: "Recipe", portions: 4, selling_units: [] } },
    ] }));
    expect(result.imageId).toBeNull();
  });

  it("extracts the catalog recipe sections, ingredient tiles, prices and allergens", () => {
    const id = "recipe";
    const pasta = "11111111-1111-1111-1111-111111111111";
    const salt = "22222222-2222-2222-2222-222222222222";
    const text = (markdown: string, extra: Record<string, unknown> = {}) => ({ type: "RICH_TEXT", markdown, ...extra });
    const pml = (pmlId: string, component: unknown) => ({ type: "PML", id: pmlId, pml: { component } });
    const components = JSON.stringify([
      { id: pasta, excluded: false, transformations: { allergy_info: { allergy_info_contains: ["GLUTEN"], allergy_info_may_contain: ["SOY"] } } },
      { id: salt, excluded: false, transformations: { allergy_info: { allergy_info_contains: ["CELERY"], allergy_info_may_contain: [] } } },
    ]);
    const tile = {
      ...pml(`core-wide-selling-unit-tile-${pasta}`, {
        type: "STACK",
        children: [
          { type: "REFERENCE_CONTAINER", id: "selling-unit-image", child: { type: "IMAGE", source: { id: "pasta-image" } } },
          {
            type: "STACK",
            axis: "VERTICAL",
            children: [
              { type: "STACK", axis: "VERTICAL", children: [{ type: "CONTAINER", child: text("#(#333333)Casarecce #(#333333)", { textType: "SUBTITLE1" }) }, { type: "CONTAINER", child: text("Barilla") }] },
              { type: "CONTAINER", child: { type: "STACK", children: [text("3.35")] } },
              { type: "STACK", axis: "HORIZONTAL", children: [text("500 gram"), text("(175 g nodig)")] },
            ],
          },
        ],
      }),
      analytics: { contexts: [
        { schema: "iglu:tech.picnic.snowplow.analytics/promotion/jsonschema/1-1-0", data: { promotion_label: "Family" } },
        { schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-6-0", data: { recipe_id: id, selling_units: [{ ingredient_id: pasta, selling_unit_id: "s1" }] } },
      ] },
    };
    const result = extractRecipeDetails(id, page({ children: [
      { data: { recipe_id: id, recipe_name: "Pasta", portions: 6, selling_units: [
        { ingredient_id: pasta, selling_unit_id: "s1", quantity: 2, status: "ACTIVE", checked: true },
        { ingredient_id: salt, selling_unit_id: "s2", quantity: 1, status: "ACTIVE", checked: false },
      ] } },
      { type: "STATE_BOUNDARY", id: "sellablePageState", state: { defaultSelectedIngredientIds: [pasta] } },
      { type: "STATE_BOUNDARY", id: "sellableContentState", state: { ingredientsState: [
        { ingredientId: pasta, ingredientType: "CORE", isAvailable: true, sellingUnits: { s1: { price: 335, referencePrice: 399, priceRanges: [{ price: 335, from_quantity: 1 }, { price: 325, from_quantity: 2 }] } } },
        { ingredientId: salt, ingredientType: "CUPBOARD", isAvailable: false, sellingUnits: { s2: { price: 99, referencePrice: 99, priceRanges: [{ price: 99, from_quantity: 1 }] } } },
      ] } },
      pml("selling-group-details-heading", { type: "STACK", children: [text("Zó klaar"), { type: "CONTAINER", child: text("Pasta") }, text("Snel klaar.")] }),
      pml("selling-group-time-and-price-section", { type: "STACK", children: [
        { type: "STACK", children: [text("1 uur 10 min"), text("Totaal")] },
        { type: "STACK", children: [{ type: "STACK", children: [{ type: "RICH_TEXT", markdown: { type: "EXPRESSION" } }] }] },
      ] }),
      tile,
      { type: "EXPRESSION", expression: `const id = "recipe";\n    const components = ${components};\n    return false;` },
      { type: "EXPRESSION", expression: 'const translationsMap = {\n        CELERY: "Selderij",\n        GLUTEN: "Gluten",\n        SOY: "Soja"\n    };' },
      pml("instructions-portions-section", text("4 porties")),
      pml("warning-banner", { type: "CONTAINER", child: text("**Let op:** dit is de originele bereidingswijze voor 4 porties") }),
      pml("instructions-section", { type: "STACK", children: [
        { type: "STACK", children: [text("Stap 1"), text("Kook **175 g casarecce**.")] },
        { type: "STACK", children: [text("Stap 2"), text("Serveer.")] },
      ] }),
      { id: "accordion-list", items: [{ header: text("**Voedingswaarden**"), body: { type: "STACK", children: [
        { type: "STACK", axis: "HORIZONTAL", distribution: "SPACE_BETWEEN", children: [text("Energie", { textType: "HEADLINE2" }), text("2.186 kJ")] },
      ] } }] },
    ] }));

    expect(result).toMatchObject({
      tag: "Zó klaar",
      description: "Snel klaar.",
      times: [{ value: "1 uur 10 min", label: "Totaal" }],
      cookingTimeMinutes: 70,
      steps: ["Kook **175 g casarecce**.", "Serveer."],
      stepsPortions: 4,
      stepsWarning: "Let op: dit is de originele bereidingswijze voor 4 porties",
      nutritionRows: [{ label: "Energie", value: "2.186 kJ", isCategory: true, backgroundColor: null }],
      allergens: { contains: ["Gluten"], mayContain: ["Soja"] },
    });
    expect(result.ingredients).toMatchObject([
      {
        name: "Casarecce",
        brand: "Barilla",
        isAvailable: true,
        unavailableReason: null,
        type: "CORE",
        imageId: "pasta-image",
        unitQuantity: "500 gram",
        neededText: "(175 g nodig)",
        price: 335,
        originalPrice: 399,
        priceRanges: [{ price: 335, from_quantity: 1 }, { price: 325, from_quantity: 2 }],
        promotionLabel: "Family",
        allergens: { contains: ["Gluten"], mayContain: ["Soja"] },
      },
      { name: null, type: "CUPBOARD", isAvailable: false, unavailableReason: null, price: 99, originalPrice: null, priceRanges: null, allergens: { contains: ["Selderij"], mayContain: [] } },
    ]);
  });
});
