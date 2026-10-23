import { extractFavorites, extractFavoritesInAisle } from "./favorites";
import { fusionHeader, fusionTile } from "./tiles.fixtures";

const tab = (aisleId: string, title: string) => ({ type: "PML", id: `aisles-segment-control-${aisleId}`, pml: { component: { type: "RICH_TEXT", markdown: title } } });

const page = {
  body: {
    type: "BLOCK",
    id: "content-container",
    children: [
      { type: "BLOCK", id: "aisle-header-container", children: [tab("FRUIT", "Fruit"), tab("DAIRY", "Zuivel & eieren"), tab("PET", "Dier")] },
      {
        type: "BLOCK",
        id: "segment-control-container",
        children: [
          { type: "BLOCK", id: "aisle-FRUIT", children: [fusionHeader("aisle-header-FRUIT", "Fruit"), fusionTile({ id: "s1", name: "Appels" }), fusionTile({ id: "s2", name: "Peren" })] },
          {
            type: "BLOCK",
            id: "aisle-DAIRY",
            children: [
              fusionHeader("aisle-header-DAIRY", "Zuivel & eieren"),
              fusionTile({ id: "s3", name: "Melk" }),
              // The promotions within an aisle load later.
              { type: "SUSPENSE", id: "campaign-grid-suspense-DAIRY", child: fusionTile({ id: "s9", name: "Actie" }) },
              { type: "PML", id: "core-vertical-tiles-more-button-pml__2" },
            ],
          },
          { type: "SUSPENSE", id: "PET", pageConfig: { id: "partial-aisle-content-wrapper", parameters: { aisle_ids: "PET", index: 2 } } },
        ],
      },
    ],
  },
};

describe("extractFavorites", () => {
  it("reads the aisles from the tabs and the products the page shows per aisle", () => {
    expect(extractFavorites(page).aisles.map((a) => [a.id, a.title, a.products.map((p) => p.id), a.complete])).toEqual([
      ["FRUIT", "Fruit", ["s1", "s2"], true],
      ["DAIRY", "Zuivel & eieren", ["s3"], false],
      ["PET", "Dier", [], false],
    ]);
  });
});

describe("extractFavoritesInAisle", () => {
  it("returns the product tiles of the aisle page", () => {
    const aisle = { body: { type: "BLOCK", id: "aisle-deep-dive", children: [fusionTile({ id: "s3", name: "Melk" }), fusionTile({ id: "s4", name: "Kwark" })] } };
    expect(extractFavoritesInAisle(aisle).map((p) => p.name)).toEqual(["Melk", "Kwark"]);
  });
});
