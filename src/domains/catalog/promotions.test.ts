import type { RscPageContent } from "../../pages/types";
import { extractPromotionGroup, extractPromotions } from "./promotions";
import { fusionGroupCard, fusionHeader, fusionMarker, fusionTile } from "./tiles.fixtures";

const section = (id: string, title: string, children: unknown[]) => ({ type: "BLOCK", id, children: [fusionHeader(`${id}-core-sub-header`, title), ...children] });

const page = {
  id: "promo-page-root",
  body: {
    type: "BLOCK",
    id: "campaign-page-layout-content_0000",
    children: [
      fusionMarker("marker-promobox"),
      { type: "SUSPENSE", id: "promobox-suspense", child: section("promobox", "Keuzekorting", [fusionTile({ id: "s1", name: "Appels", promotion: { label: "20% korting" } })]) },
      fusionMarker("end-marker-promobox"),
      fusionMarker("marker-1-campaign-promo-section_0000"),
      section("1-campaign-promo-section_0000", "Zuivel", [
        fusionTile({ id: "s2", name: "Yoghurt" }),
        fusionGroupCard("group-1", "Plantaardige yoghurt", "Bv. sojayoghurt", "2 voor €3.99"),
        fusionGroupCard("group-1", "Plantaardige yoghurt", "Bv. sojayoghurt", "2 voor €3.99"),
      ]),
      fusionMarker("end-marker-1-campaign-promo-section_0000"),
      section("2-campaign-promo-section_0000", "Leeg", []),
    ],
  },
};

describe("extractPromotions", () => {
  it("reads the sections between the markers with their products and promotion groups", () => {
    const promotions = extractPromotions(page);

    expect(promotions.sections.map((s) => [s.id, s.title, s.products.map((p) => p.id), s.groups])).toEqual([
      ["promobox-suspense", "Keuzekorting", ["s1"], []],
      ["1-campaign-promo-section_0000", "Zuivel", ["s2"], [{ id: "group-1", name: "Plantaardige yoghurt", example: "Bv. sojayoghurt", label: "2 voor €3.99" }]],
    ]);
    expect(promotions.sections[0].products[0].labels).toEqual([{ position: "bottomLeft", type: "PROMO", text: "20% korting" }]);
  });

  it("returns no sections for a page without the layout block", () => {
    expect(extractPromotions({})).toEqual({ sections: [] });
  });
});

describe("extractPromotionGroup", () => {
  it("reads the name and products of the promo-deep-dive-content component", () => {
    const product = { id: "s3", name: "Sojayoghurt", displayPrice: 199 };
    const content = {
      pageId: "promo-group-deep-dive?promo_group_id=group-1",
      tokens: {},
      nodes: [{ id: "c-0", component: "promo-deep-dive-content", modulePath: "./x.tsx", props: { name: "Plantaardige yoghurt", sellableTiles: [product, { type: "spacer" }] }, children: [] }],
    } as unknown as RscPageContent;

    expect(extractPromotionGroup("group-1", content)).toEqual({ id: "group-1", name: "Plantaardige yoghurt", products: [product] });
  });
});
