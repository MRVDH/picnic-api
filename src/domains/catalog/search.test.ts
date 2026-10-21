import { extractSearchResults } from "./search";

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
      { id: "r1", name: "Warme chocolademelk", subtitle: "met kruidnootjes", imageId: "recipes/abc", tags: ["15 min"] },
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
