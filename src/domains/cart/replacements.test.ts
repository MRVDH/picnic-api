import { extractCartReplacements } from "./replacements";
import type { RscPageContent } from "../../pages/types";

/** A replacement tile as the page sends it: a sellable tile without a `type`. */
const tile = (id: string, name: string, price: number, referencePrice?: number) => ({
  presentation: "REGULAR",
  id,
  subtitle: { text: "Merk" },
  title: { title: name, prefix: "Bio " },
  price: { priceValue: price, ...(referencePrice && { referencePriceValue: referencePrice }), priceRanges: [{ fromQuantity: 1, price: price * 100 }] },
  suffixes: [{ type: "TEXT", text: "1 stuk" }],
  labels: { topLeft: [], topRight: [], middleLeft: [], bottomLeft: [] },
  images: { primaryImage: { imageId: `img-${id}` } },
  unavailability: null,
});

const content = (props: Record<string, unknown>): RscPageContent => ({
  pageId: "unavailability-replacements-page-root",
  tokens: {},
  nodes: [
    {
      id: "page-0",
      component: "page-hydrator",
      modulePath: "./presentational-components/page/page-hydrator.tsx",
      props: {},
      children: [
        {
          id: "unavailability-replacements-content-0",
          component: "unavailability-replacements-content",
          modulePath: "./pages/unavailability-replacements-page/components/unavailability-replacements-content.tsx",
          props,
          children: [],
        },
      ],
    },
  ],
});

describe("extractCartReplacements", () => {
  it("reads the reason and the alternatives as product tiles", () => {
    const result = extractCartReplacements(
      content({
        hasAlternatives: true,
        reason: "TEMPORARILY_UNAVAILABLE",
        alternativeViewModels: [tile("s2", "rode kool", 1.79, 1.99), tile("s3", "spitskool", 1.49), { id: "s4" }],
      }),
      "s1",
    );

    expect(result.productId).toBe("s1");
    expect(result.reason).toBe("TEMPORARILY_UNAVAILABLE");
    expect(result.replacements).toMatchObject([
      { id: "s2", name: "rode kool", namePrefix: "Bio", brand: "Merk", displayPrice: 179, originalPrice: 199, unitQuantity: "1 stuk", imageId: "img-s2" },
      { id: "s3", name: "spitskool", displayPrice: 149, originalPrice: null },
    ]);
  });

  it("returns no replacements when the page has none", () => {
    const result = extractCartReplacements(content({ hasAlternatives: false, reason: "", alternativeViewModels: [] }), "s1");
    expect(result).toEqual({ productId: "s1", reason: null, replacements: [] });
  });
});
