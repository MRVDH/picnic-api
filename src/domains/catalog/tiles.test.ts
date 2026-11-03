import { collectFusionProductTiles, readFusionProductTile } from "./tiles";
import { fusionTile } from "./tiles.fixtures";

describe("readFusionProductTile", () => {
  it("reads the selling unit and the info column into a product tile", () => {
    const tile = fusionTile({
      id: "s1000001",
      name: "Picnic kiwi's",
      shownName: "Kiwi's",
      qualityCue: "Friszuur",
      brand: "Merk",
      unitQuantity: "6 stuks",
      price: 369,
      promotion: { label: "nu €3.69", originalPrice: 419 },
    });

    expect(readFusionProductTile(tile)).toEqual({
      id: "s1000001",
      name: "Kiwi's",
      namePrefix: null,
      brand: "Merk",
      qualityCue: "Friszuur",
      imageId: "image-s1000001",
      displayPrice: 369,
      originalPrice: 419,
      unitPrice: null,
      priceRanges: null,
      unitQuantity: "6 stuks",
      labels: [{ position: "bottomLeft", type: "PROMO", text: "nu €3.69" }],
      isUnavailable: false,
      numberOfOrders: null,
    });
  });

  it("reads a bold start of the name as its prefix, and no brand when the row after the price is the package size", () => {
    const tile = fusionTile({ id: "s1000002", name: "Picnic bio citroenen", shownName: "#(#628003)**Bio**#(#628003) citroenen", unitQuantity: "3 stuks" });

    expect(readFusionProductTile(tile)).toMatchObject({ name: "citroenen", namePrefix: "Bio", brand: null, qualityCue: null, originalPrice: null, labels: [] });
  });

  it("reads a first span of the name in a highlight color as its prefix", () => {
    const tile = fusionTile({ id: "s1000003", name: "Edeka Bio Bio Fettarme H-Milch 1,5%", nameSpans: ["#(#628003)Bio#(#628003) ", "#(#333333)Fettarme H-Milch 1,5%#(#333333) "] });

    expect(readFusionProductTile(tile)).toMatchObject({ name: "Fettarme H-Milch 1,5%", namePrefix: "Bio" });
  });

  it("keeps a first span in the regular text color as part of the name", () => {
    const tile = fusionTile({ id: "s1000004", name: "Picnic halfvolle melk", nameSpans: ["#(#333333)Halfvolle#(#333333) ", "#(#333333)melk#(#333333) "] });

    expect(readFusionProductTile(tile)).toMatchObject({ name: "Halfvolle melk", namePrefix: null });
  });

  it("keeps price tiers only when the price depends on the quantity", () => {
    const tiers = [
      { price: 250, from_quantity: 1 },
      { price: 200, from_quantity: 2 },
    ];
    expect(readFusionProductTile(fusionTile({ id: "s1000003", name: "Paprika", price: 250, priceRanges: tiers }))?.priceRanges).toEqual(tiers);
  });

  it("returns null for a tile without a selling unit", () => {
    expect(readFusionProductTile({ type: "PML", content: { type: "SELLING_UNIT_TILE" } })).toBeNull();
  });
});

describe("collectFusionProductTiles", () => {
  it("returns each product once, in document order, and leaves out skipped subtrees", () => {
    const page = {
      children: [
        fusionTile({ id: "s1", name: "Een" }),
        { type: "SUSPENSE", child: fusionTile({ id: "s3", name: "Drie" }) },
        fusionTile({ id: "s2", name: "Twee" }),
        fusionTile({ id: "s1", name: "Een" }),
      ],
    };

    expect(collectFusionProductTiles(page).map((tile) => tile.id)).toEqual(["s1", "s3", "s2"]);
    expect(collectFusionProductTiles(page, (node) => node.type === "SUSPENSE").map((tile) => tile.id)).toEqual(["s1", "s2"]);
  });
});
