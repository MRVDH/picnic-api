import { extractCartFooter } from "./footer";

const loyaltyNudge = {
  id: "loyalty-point-nudge-content",
  children: [
    { type: "RICH_TEXT", markdown: "**Spaarpunten**", textAttributes: { color: "#333333" } },
    { type: "RICH_TEXT", markdown: "#(#B40117)120 punten#(#B40117)", textAttributes: { color: "#B40117" } },
  ],
};

const recommendationsHeader = {
  id: "horizontal-selling-unit-tiles-sub-header",
  children: [
    { type: "RICH_TEXT", markdown: "Niets vergeten?" },
    { type: "ICON", iconKey: "chevron-right" },
  ],
};

const recommendationsTiles = {
  id: "horizontal-selling-unit-tiles",
  children: [
    {
      id: "item-s1000001",
      children: [
        { type: "IMAGE", source: { id: "image-1" } },
        { type: "PML", backgroundColor: "#FFF200" },
        { type: "ICON", iconKey: "percentage" },
      ],
    },
    {
      id: "item-s1000002",
      children: [{ type: "IMAGE", source: { id: "image-2" } }],
    },
    {
      // Not a tile: the id has no item- prefix.
      id: "banner-1",
      children: [{ type: "IMAGE", source: { id: "image-3" } }],
    },
    {
      // Dropped: the tile has no image.
      id: "item-s1000003",
      children: [{ type: "IMAGE", source: {} }],
    },
  ],
};

describe("extractCartFooter", () => {
  it("reads the loyalty points as label and value with their colors", () => {
    const footer = extractCartFooter({ children: [loyaltyNudge] });

    expect(footer.loyaltyPoints).toEqual({
      label: { text: "Spaarpunten", color: "#333333" },
      value: { text: "120 punten", color: "#B40117" },
    });
  });

  it("reads the recommendation title and tiles", () => {
    const footer = extractCartFooter({ children: [recommendationsHeader, recommendationsTiles] });

    expect(footer.recommendations).toEqual({
      title: "Niets vergeten?",
      pageId: "basket-recommendations-root",
      tiles: [
        { productId: "s1000001", imageId: "image-1", backgroundColor: "#FFF200", hasPromo: true },
        { productId: "s1000002", imageId: "image-2", backgroundColor: null, hasPromo: false },
      ],
    });
  });

  it("returns null for parts Picnic does not send", () => {
    expect(extractCartFooter({ children: [recommendationsHeader] })).toEqual({
      loyaltyPoints: null,
      recommendations: null,
    });
  });

  it("returns null for loyalty points when the value text is empty", () => {
    const footer = extractCartFooter({
      id: "loyalty-point-nudge-content",
      children: [{ type: "RICH_TEXT", markdown: "Spaarpunten" }],
    });

    expect(footer.loyaltyPoints).toBeNull();
  });

  it("returns empty parts for a page that is not an object", () => {
    expect(extractCartFooter(null)).toEqual({ loyaltyPoints: null, recommendations: null });
    expect(extractCartFooter("<rsc payload>")).toEqual({ loyaltyPoints: null, recommendations: null });
  });
});
