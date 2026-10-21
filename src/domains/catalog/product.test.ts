import { extractProductDetails } from "./product";
import { ProductNotFoundError } from "../../errors/product-not-found-error";
import type { FusionPage } from "../../pages/fusion";

const text = (markdown: unknown, extra: Record<string, unknown> = {}) => ({ type: "RICH_TEXT", markdown, ...extra });
const badge = (markdown: string, backgroundColor: string) => ({
  type: "CONTAINER",
  backgroundColor,
  borderRadius: 4,
  child: text(markdown, { textAttributes: { color: "#333333" } }),
});
const dot = { type: "CONTAINER", backgroundColor: "#333333", borderRadius: 4, width: 4, height: 4, child: null };
const pml = (id: string, component: unknown) => ({ type: "PML", id, pml: { component } });
const tiers = [
  { price: 189, from_quantity: 1 },
  { price: 185, from_quantity: 2 },
];

type PageOptions = { quantityRow: unknown[]; prices?: unknown[]; labels?: unknown[]; rest?: unknown[] };

/** A product details page with the parts of the main container that the parser reads. */
function page({ quantityRow, prices = [], labels = [], rest = [] }: PageOptions): FusionPage {
  const mainContainer = pml("product-details-page-root-main-container", {
    type: "STACK",
    axis: "VERTICAL",
    children: [
      { type: "CONTAINER", child: text("#(#333333)Halfvolle melk#(#333333)", { textType: "HEADER1" }) },
      text("Campina"),
      { type: "STACK", axis: "HORIZONTAL", children: quantityRow },
      { type: "CONTAINER", child: { type: "STACK", children: prices } },
    ],
  });
  return {
    layout: {
      id: "product-details-page-root",
      body: {
        children: [
          { type: "SELLING_UNIT", content: { sellingUnit: { id: "s1", max_count: 50, image_id: "img1" } } },
          pml("product-page-labels-s1", { type: "CONTAINER", child: { type: "STACK", axis: "HORIZONTAL", children: labels } }),
          mainContainer,
          ...rest,
        ],
      },
    },
  } as unknown as FusionPage;
}

describe("extractProductDetails", () => {
  it("reads a size badge separately from the unit quantity and unit price", () => {
    const details = extractProductDetails(
      "s1",
      page({
        quantityRow: [badge("#(#ffffff)XL#(#ffffff)", "#268484"), dot, text("#(#333333)1.5 liter#(#333333)"), dot, text("€1.17/l")],
        prices: [{ type: "PRICE", price: 175, color: "#B40117" }, { type: "PRICE", price: 195, isCrossed: true }],
      })
    );

    expect(details).toMatchObject({
      name: "Halfvolle melk",
      brand: "Campina",
      quantityBadges: [{ text: "XL", textColor: "#ffffff", backgroundColor: "#268484" }],
      unitQuantity: "1.5 liter",
      unitPrice: "€1.17/l",
      tags: [],
      displayPrice: 175,
      originalPrice: 195,
      displayPriceColor: "#B40117",
      priceRanges: null,
      maxCount: 50,
      imageIds: ["img1"],
    });
  });

  it("reads texts after the unit price as tags", () => {
    const details = extractProductDetails(
      "s1",
      page({
        quantityRow: [text("410 gram"), dot, text("€10.46/kg"), dot, text("#(#333333)#(#5b534e)Diepvries#(#5b534e)#(#333333)")],
        prices: [{ type: "PRICE", price: 429 }],
      })
    );

    expect(details.unitPrice).toBe("€10.46/kg");
    expect(details.tags).toEqual([{ text: "Diepvries", color: "#5b534e" }]);
  });

  it("computes the unit price and display price from the product's own price tiers", () => {
    const unitPriceExpression = { type: "EXPRESSION", props: { v0: "s1", v1: 0.6667, v2: "€", v3: "/l", __ep1: { v1: tiers } } };
    const similarProductTiers = [{ price: 139, from_quantity: 1 }];
    const details = extractProductDetails(
      "s1",
      page({
        quantityRow: [text("1.5 liter"), dot, text(unitPriceExpression)],
        rest: [pml("alternatives-container", { type: "STACK", children: [{ props: { __ep1: { v1: similarProductTiers } } }] })],
      })
    );

    expect(details.unitPrice).toBe("€1.26/l");
    expect(details.priceRanges).toEqual(tiers);
    expect(details.displayPrice).toBe(189);
  });

  it("ignores price tiers and promotions of other products on the page", () => {
    const otherTile = { sellingUnit: { id: "s2", display_price: 349, price_ranges: [{ price: 349, from_quantity: 1 }] } };
    const details = extractProductDetails(
      "s1",
      page({
        quantityRow: [text("130 gram"), dot, text("€20.69/kg")],
        prices: [{ type: "PRICE", price: 269 }],
        rest: [{ id: "alternatives-container", children: [otherTile, { promotion_id: "p2", promotion_label: "25% korting" }] }],
      })
    );

    expect(details.priceRanges).toBeNull();
    expect(details.promotion).toBeNull();
    expect(details.similarProducts).toMatchObject([{ id: "s2", displayPrice: 349 }]);
  });

  it("takes the promotion id from tiles with the same promotion as the product's label", () => {
    const details = extractProductDetails(
      "s1",
      page({
        quantityRow: [text("130 gram")],
        prices: [{ type: "PRICE", price: 269 }],
        labels: [badge("Biologisch", "#ffffff"), badge("2+1 gratis", "#fbd92b")],
        rest: [{ promotion_id: "p2", promotion_label: "25% korting" }, { promotion_id: "p1", promotion_label: "2+1 gratis" }],
      })
    );

    expect(details.labels.map((label) => label.text)).toEqual(["Biologisch", "2+1 gratis"]);
    expect(details.promotion).toEqual({ id: "p1", label: "2+1 gratis" });
  });

  it("reads highlights, allergens and the nutrition table", () => {
    const row = (label: string, value: string, textType?: string) => ({
      type: "STACK",
      axis: "HORIZONTAL",
      distribution: "SPACE_BETWEEN",
      children: [text(label, textType ? { textType } : {}), text(value)],
    });
    const details = extractProductDetails(
      "s1",
      page({
        quantityRow: [text("1 stuk")],
        rest: [
          pml("product-page-highlights", {
            type: "STACK",
            children: [
              { type: "STACK", axis: "HORIZONTAL", children: [{ type: "ICON", iconKey: "leaf" }, text("Biologisch")] },
              { type: "TOUCHABLE", onPress: { actionType: "OPEN", target: "app.picnic://x" }, child: { type: "STACK", axis: "HORIZONTAL", children: [text("Nutri-Score B")] } },
            ],
          }),
          pml("product-page-allergies", {
            type: "STACK",
            children: [
              text("Bevat"),
              { type: "STACK", axis: "HORIZONTAL", children: [badge("Melk", "#1575a3")] },
              text("Bevat mogelijk"),
              { type: "STACK", axis: "HORIZONTAL", children: [badge("Noten", "#966e35")] },
            ],
          }),
          {
            id: "accordion-list",
            items: [
              { header: text("Ingrediënten"), body: text("Melk") },
              { header: text("Voedingswaarde"), body: { type: "STACK", children: [row("Energie", "200 kJ", "HEADLINE2"), row("Vet", "1.5 g")] } },
            ],
          },
        ],
      })
    );

    expect(details.highlightItems).toEqual([
      { text: "Biologisch", iconKey: "leaf", linkTarget: null },
      { text: "Nutri-Score B", iconKey: null, linkTarget: "app.picnic://x" },
    ]);
    expect(details.allergenGroups).toEqual({
      contains: [{ text: "Melk", textColor: "#333333", backgroundColor: "#1575a3" }],
      mayContain: [{ text: "Noten", textColor: "#333333", backgroundColor: "#966e35" }],
    });
    expect(details.infoSections.map((section) => section.title)).toEqual(["Ingrediënten", "Voedingswaarde"]);
    expect(details.nutritionRows).toEqual([
      { label: "Energie", value: "200 kJ", isCategory: true, backgroundColor: null },
      { label: "Vet", value: "1.5 g", isCategory: false, backgroundColor: null },
    ]);
  });

  it("throws a ProductNotFoundError for the product-not-found page", () => {
    const fallback = { layout: { id: "product-details-page-fallback", body: { child: text("Product niet gevonden") } } } as unknown as FusionPage;

    expect(() => extractProductDetails("s1", fallback)).toThrow(ProductNotFoundError);
  });
});
