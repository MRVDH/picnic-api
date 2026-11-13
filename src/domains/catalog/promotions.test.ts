import type { RscPageContent } from "../../pages/types";
import { extractPromotionGroup, extractPromotions, extractRscPromotions } from "./promotions";
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

describe("extractRscPromotions", () => {
  const tile = (id: string) => ({
    id,
    name: `Product ${id}`,
    displayPrice: 199,
    labels: [],
  });
  const groupDeeplink = (id: string) => `app.picnic://store/page;id=promo-group-deep-dive,promo_group_id=${id}`;
  const collector = (data: unknown[]) => ({
    id: `c-${data.length}`,
    component: "streaming-data-collector",
    modulePath: "./x.jsx",
    props: { data, index: 0 },
    children: [],
  });
  const content = {
    pageId: "promo-page-root",
    tokens: {},
    nodes: [
      {
        id: "root",
        component: "streaming-data-collector",
        modulePath: "./x.jsx",
        props: { eager: true },
        children: [
          collector([
            {
              type: "RESOLVED",
              componentIndex: 2,
              component: {
                id: "promo_page_dairy_section",
                effect_template_name: "PAGE_LAYOUT",
                items: [
                  { id: "dairy_title", type: "section-title", title: "Zuivel" },
                  {
                    id: "dairy_marker",
                    effect_template_name: "SCROLL_TO_POSITION_MARKER",
                    name: "Zuivel",
                  },
                  {
                    id: "dairy_card",
                    effect_template_name: "LIST",
                    items: [
                      {
                        id: "g1",
                        type: "campaign",
                        title: "Yoghurt",
                        subtitle: "Lekker romig",
                        deeplink: groupDeeplink("g1"),
                      },
                    ],
                  },
                  {
                    id: "dairy_list",
                    effect_template_name: "LIST",
                    items: [
                      {
                        id: "g1",
                        type: "promo-group-list-item",
                        title: "Yoghurt",
                        subtitle: "Bv. sojayoghurt",
                        accessibilityLabel: "Yoghurt 2 voor €3.99",
                        deeplink: groupDeeplink("g1"),
                      },
                      {
                        id: "g2",
                        type: "promo-group-list-item",
                        title: "Kwark",
                        subtitle: "Bv. magere kwark",
                        badge: { text: "Nu vanaf €1.69" },
                        accessibilityLabel: "Kwark Nu vanaf €1.69",
                        deeplink: groupDeeplink("g2"),
                      },
                    ],
                  },
                  {
                    id: "dairy_tiles",
                    effect_template_name: "LIST",
                    items: [tile("s2"), tile("s3"), tile("s2")],
                  },
                ],
              },
            },
            { type: "FAILED", componentIndex: 1, error: { message: "" } },
          ]),
          collector([
            {
              type: "RESOLVED",
              componentIndex: 0,
              component: {
                id: "marker",
                effect_template_name: "SCROLL_TO_POSITION_MARKER",
              },
            },
            {
              type: "RESOLVED",
              componentIndex: 1,
              component: {
                title: "Keuzekorting",
                effect_template_name: "PROMOBOX",
                items: [tile("s1")],
              },
            },
            {
              type: "RESOLVED",
              componentIndex: 3,
              component: {
                id: "empty_section",
                effect_template_name: "PAGE_LAYOUT",
                items: [{ type: "section-title", title: "Leeg" }],
              },
            },
          ]),
        ],
      },
    ],
  } as unknown as RscPageContent;

  it("reads the streamed sections in page order with their products and promotion groups", () => {
    const promotions = extractRscPromotions(content);

    expect(promotions.sections.map((s) => [s.id, s.title, s.products.map((p) => p.id), s.groups])).toEqual([
      ["", "Keuzekorting", ["s1"], []],
      [
        "promo_page_dairy_section",
        "Zuivel",
        ["s2", "s3"],
        [
          {
            id: "g1",
            name: "Yoghurt",
            example: "Bv. sojayoghurt",
            label: "2 voor €3.99",
          },
          {
            id: "g2",
            name: "Kwark",
            example: "Bv. magere kwark",
            label: "Nu vanaf €1.69",
          },
        ],
      ],
    ]);
  });

  it("returns no sections for a page without streamed effects", () => {
    expect(
      extractRscPromotions({
        pageId: "promo-page-root",
        tokens: {},
        nodes: [],
      }),
    ).toEqual({ sections: [] });
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
