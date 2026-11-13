import { extractFusionSearchResults, extractSearchResults } from "./search";
import { fusionTile } from "./tiles.fixtures";

describe("extractSearchResults", () => {
  const props = {
    searchQuery: "melk",
    storeResults: {
      SUPERMARKET: {
        entityIdsByFacetId: { "characteristic.Bio": ["s1"] },
        sections: [
          {
            id: "Halfvol",
            type: "VISUAL",
            shouldShowHeader: true,
            headerName: "Halfvol",
            items: [
              {
                type: "sellable",
                id: "s1",
                title: { title: "halfvolle melk", prefix: "Bio " },
                subtitle: { text: "Picnic" },
                images: { primaryImage: { imageId: "img1" } },
                price: { priceValue: 1.75, referencePriceValue: 1.95, priceRanges: [{ fromQuantity: 1, price: 175 }] },
                suffixes: [{ type: "SIZE", text: "XL" }, { type: "TEXT", text: "1.5 liter" }],
                labels: { bottomLeft: [{ type: "PROMO", labelText: "10% korting" }] },
                unavailability: null,
              },
              { type: "promo-box", id: "p1" },
            ],
          },
        ],
        powerFilters: [{ facetId: "characteristic.Bio", header: "Bio", name: "Bio", image: "bio-image" }],
        sortingOptions: [{ name: "RELEVANCE", localizedTitle: "Relevant voor jou" }],
        selectedSorting: "RELEVANCE",
      },
      MEALS: {
        sections: [
          {
            items: [
              {
                id: "r1",
                text: { title: { text: "Warme chocolademelk" }, subtitle: { text: "met kruidnootjes" }, tags: [{ text: "15 min" }] },
                image: { imageId: "recipes/abc" },
              },
            ],
          },
        ],
      },
    },
  };

  it("extracts products, filters, sorting and recipes", () => {
    const results = extractSearchResults(props);

    expect(results.query).toBe("melk");
    expect(results.correctedQuery).toBeNull();
    expect(results.products?.sections).toEqual([
      {
        id: "Halfvol",
        type: "VISUAL",
        title: "Halfvol",
        products: [
          {
            id: "s1",
            name: "halfvolle melk",
            namePrefix: "Bio",
            brand: "Picnic",
            qualityCue: null,
            imageId: "img1",
            displayPrice: 175,
            originalPrice: 195,
            unitPrice: null,
            comparisonPrice: { unit: "l", price: 117, lowestPrice: null },
            priceRanges: [{ price: 175, from_quantity: 1 }],
            unitQuantity: "1.5 liter",
            labels: [{ position: "bottomLeft", type: "PROMO", text: "10% korting" }],
            isUnavailable: false,
            numberOfOrders: null,
          },
        ],
      },
    ]);
    expect(results.products?.powerFilters).toEqual([{ facetId: "characteristic.Bio", name: "Bio", imageId: "bio-image" }]);
    expect(results.products?.productIdsByFacetId).toEqual({ "characteristic.Bio": ["s1"] });
    expect(results.products?.sortingOptions).toEqual([{ name: "RELEVANCE", title: "Relevant voor jou" }]);
    expect(results.recipes).toEqual([
      { id: "r1", name: "Warme chocolademelk", subtitle: "met kruidnootjes", imageId: "recipes/abc", tags: ["15 min"], cookingTimeMinutes: 15 },
    ]);
  });

  it("returns null products when the response has no supermarket results", () => {
    expect(extractSearchResults({ searchQuery: "x", storeResults: {} }).products).toBeNull();
  });

  it("takes the display price from priceValue and falls back to the lowest-quantity price tier", () => {
    const tile = (price: Record<string, unknown>) => ({ type: "sellable", id: "s1", title: { title: "Bier" }, price });
    const results = extractSearchResults({
      storeResults: {
        SUPERMARKET: {
          sections: [
            {
              id: "Bier",
              items: [
                { ...tile({ priceValue: 1.5, priceRanges: [{ fromQuantity: 2, price: 140 }, { fromQuantity: 1, price: 160 }] }), id: "s1" },
                { ...tile({ priceRanges: [{ fromQuantity: 3, price: 120 }, { fromQuantity: 1, price: 160 }] }), id: "s2" },
              ],
            },
          ],
        },
      },
    });

    expect(results.products?.sections[0].products.map((product) => product.displayPrice)).toEqual([150, 160]);
  });
});

describe("extractFusionSearchResults", () => {
  const text = (markdown: string, extra: Record<string, unknown> = {}) => ({ type: "RICH_TEXT", markdown, ...extra });
  const header = (name: string, isHidden: unknown = false) => ({
    type: "BLOCK",
    id: `client-side-filtering-section-header-wrapper-${name}`,
    isHidden,
    children: [{ type: "PML", id: `header-${name}`, pml: { component: text(`#(#333333)${name}#(#333333)`, { textType: "HEADER3" }) } }],
  });
  const wrapper = (id: string, ...tiles: unknown[]) => ({ type: "BLOCK", id: `client-side-filtering-section-wrapper-${id}`, children: tiles });
  const filter = (facetId: string, name: string, type: string, imageId: string) => ({
    type: "PML",
    id: `search-header-visual-item-${facetId}`,
    pml: {
      component: {
        type: "TOUCHABLE",
        onPress: { actionType: "CALLBACK", callback: { type: "EXPRESSION", expression: "toggleFilterExpression1", props: { v0: facetId, v1: name, v2: type } } },
        child: { type: "STACK", children: [{ type: "IMAGE", source: { id: imageId } }, text(name)] },
      },
    },
  });
  const page = {
    layout: {
      type: "STATE_BOUNDARY",
      id: "searchState",
      state: {
        analyticsTemplate: { data: { query: "mlich", query_corrected: "milch", initial_sorting_strategies: ["RELEVANCE", "PRICE"] } },
        sections: [{ index: 1, name: "Nochmal bestellen" }, { index: 1, name: "H-Milch" }],
        selectedEntityType: "SELLING_UNIT",
        selectedSorting: "RELEVANCE",
        sellingUnitIdsByFacetIds: { "category_level_3.1": ["s2", "s3"], "characteristic.Bio": ["s3"] },
      },
      child: {
        type: "BLOCK",
        id: "root",
        children: [
          filter("category_level_3.1", "H-Milch", "VISUAL_FILTER", "img-h"),
          filter("characteristic.Bio", "Bio", "POWER_FILTER", "img-bio"),
          {
            type: "PML",
            id: "search-header-visual-item-sorting",
            pml: {
              component: {
                type: "TOUCHABLE",
                onPress: {
                  actionType: "OPEN",
                  target: {
                    type: "EXPRESSION",
                    props: {
                      v0: "app.picnic://store/page;id=search-sort-options-root,presentation-mode=MODAL_OVER_CONTEXT,search_id=x&selected_sorting=RELEVANCE&sorting_options_ids=RELEVANCE&sorting_options_ids=PRICE&sorting_options_names=F%C3%BCr%20dich%20relevant&sorting_options_names=G%C3%BCnstigster%20Preis&term=milch",
                    },
                  },
                },
              },
            },
          },
          {
            type: "BLOCK",
            id: "structured-selling-unit-search-result",
            children: [
              header("Nochmal bestellen"),
              wrapper("Nochmal bestellen", { type: "BLOCK", id: "horizontal-selling-unit-tiles", children: [fusionTile({ id: "s1", name: "Kaffee" })] }),
              {
                type: "BLOCK",
                id: "structured-selling-unit-search-result-visual-sections",
                children: [
                  // Only shown while the filter is selected.
                  header("Bio", { type: "EXPRESSION", props: { v0: "selectedFilter", v1: "characteristic.Bio" } }),
                  header("H-Milch"),
                  wrapper("H-Milch", fusionTile({ id: "s2", name: "H-Milch 1,5%" })),
                  wrapper("H-Milch__2", fusionTile({ id: "s3", name: "Bio H-Milch 3,8%" })),
                ],
              },
            ],
          },
        ],
      },
    },
  };

  it("reads the sections, filters, facets and sort orders of a product search", () => {
    const results = extractFusionSearchResults(page, "mlich");

    expect(results).toMatchObject({ query: "mlich", correctedQuery: "milch", recipes: [] });
    expect(results.products?.sections.map(({ id, type, title, products }) => ({ id, type, title, products: products.map((product) => product.id) }))).toEqual([
      { id: "Nochmal bestellen", type: "RFY", title: "Nochmal bestellen", products: ["s1"] },
      { id: "H-Milch", type: "VISUAL", title: "H-Milch", products: ["s2", "s3"] },
    ]);
    expect(results.products).toMatchObject({
      visualFilters: [{ facetId: "category_level_3.1", name: "H-Milch", imageId: "img-h" }],
      powerFilters: [{ facetId: "characteristic.Bio", name: "Bio", imageId: "img-bio" }],
      textualFilters: [],
      productIdsByFacetId: { "category_level_3.1": ["s2", "s3"], "characteristic.Bio": ["s3"] },
      sortingOptions: [
        { name: "RELEVANCE", title: "Für dich relevant" },
        { name: "PRICE", title: "Günstigster Preis" },
      ],
      selectedSorting: "RELEVANCE",
    });
  });

  it("reads the recipes of a recipe search", () => {
    const recipePage = {
      layout: {
        type: "STATE_BOUNDARY",
        id: "searchState",
        state: { selectedEntityType: "RECIPE", selectedSorting: "RELEVANCE", sellingUnitIdsByFacetIds: {} },
        child: {
          type: "PML",
          id: "core-wide-recipe-tile__1",
          analytics: { contexts: [{ schema: "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/1-6-0", data: { recipe_id: "r1" } }] },
          pml: { component: { type: "STACK", children: [{ type: "IMAGE", source: { id: "recipes/r1" } }, text("Nudeln mit Tomatensoße"), text("15 Minuten")] } },
        },
      },
    };

    expect(extractFusionSearchResults(recipePage, "nudeln")).toEqual({
      query: "nudeln",
      correctedQuery: null,
      products: null,
      recipes: [{ id: "r1", name: "Nudeln mit Tomatensoße", subtitle: null, imageId: "recipes/r1", tags: ["15 Minuten"], cookingTimeMinutes: 15 }],
    });
  });

  it("gives no product results for a page without results", () => {
    const noResults = { layout: { type: "BLOCK", id: "root", children: [{ type: "BLOCK", id: "search-page-no-results-body", children: [] }] } };

    expect(extractFusionSearchResults(noResults, "xqzvwkj")).toEqual({ query: "xqzvwkj", correctedQuery: null, products: null, recipes: [] });
  });
});
