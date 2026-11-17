import { extractProductDetails, extractRscProductDetails } from "./product";
import { ProductNotFoundError } from "../../errors/product-not-found-error";
import type { FusionPage } from "../../pages/fusion";
import { parseRscPageContent, parseRscPayload } from "../../pages/rsc";
import type { RscPageContent } from "../../pages/types";

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

  it("reads price tiers shown as one tile per tier", () => {
    // Each tile's expressions hold only their own tier, not the list.
    const tile = (label: string, tier: { price: number; from_quantity: number }) => ({
      type: "TOUCHABLE",
      onPress: { type: "EXPRESSION", props: { v0: "s1", v1: tier.from_quantity, v4: tier.price } },
      child: {
        type: "CONTAINER",
        backgroundColor: { type: "EXPRESSION", props: { v0: "#ffffff", v1: "s1", v2: tier } },
        child: { type: "STACK", children: [text(label), text((tier.price / 100).toFixed(2))] },
      },
    });
    const details = extractProductDetails(
      "s1",
      page({
        quantityRow: [text("9 rollen")],
        prices: [
          tile("1 stuk", { price: 275, from_quantity: 1 }),
          tile("Vanaf 2", { price: 269, from_quantity: 2 }),
          tile("Vanaf 3", { price: 265, from_quantity: 3 }),
        ],
      })
    );

    expect(details.displayPrice).toBe(275);
    expect(details.priceRanges).toEqual([
      { price: 275, from_quantity: 1 },
      { price: 269, from_quantity: 2 },
      { price: 265, from_quantity: 3 },
    ]);
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
      { label: "Energie", value: "200 kJ", isCategory: true, backgroundColor: null, amount: 200, preference: "lower" },
      { label: "Vet", value: "1.5 g", isCategory: false, backgroundColor: null, amount: 1.5, preference: "lower" },
    ]);
  });

  it("throws a ProductNotFoundError for the product-not-found page", () => {
    const fallback = { layout: { id: "product-details-page-fallback", body: { child: text("Product niet gevonden") } } } as unknown as FusionPage;

    expect(() => extractProductDetails("s1", fallback)).toThrow(ProductNotFoundError);
  });
});

/**
 * A product page as Picnic serves it as RSC: the page hydrator with the theme, around one
 * `product-details-content` component with the view model. `texts` are text rows, such as a long
 * description that the view model refers to as `"$9"`.
 */
function rscProductPage(viewModel: Record<string, unknown>, texts: Record<string, string> = {}): RscPageContent {
  const theme = { tokenRegistry: { "Text/Brand/price": "#B40117", "Colour/Green/green-500": "#3F7326" } };
  const payload = [
    '1:I["./presentational-components/page/page-hydrator.tsx",["c"],"PageHydrator"]',
    '2:I["./pages/product-details/product-details-content.tsx",["c"],"ProductDetailsContent"]',
    `0:["$","$L1",null,${JSON.stringify({ theme, children: ["$", "$L2", null, { viewModel }] })}]`,
    ...Object.entries(texts).map(([id, value]) => `${id}:T${Buffer.byteLength(value).toString(16)},${value}`),
  ].join("\n");
  return parseRscPageContent("product-details-page-root?id=s1", parseRscPayload(payload));
}

describe("extractRscProductDetails", () => {
  it("reads the header, prices, labels and promotion of the view model", () => {
    const content = rscProductPage({
      id: "s1",
      title: "Merk halfvolle melk",
      headerTitle: "Halfvolle melk",
      subtitle: "Merk",
      color: { primary: "#1F5FA8" },
      suffixes: [
        { type: "SIZE", text: "XL" },
        { type: "TEXT", text: "1.5 liter" },
        { type: "UNIT_PRICE", text: "€1.26/l" },
        { type: "NOTICE_LABEL", text: "Diepvries" },
      ],
      price: {
        basePrice: 189,
        priceValue: 1.89,
        referencePriceValue: 2.29,
        priceColor: "promo",
        priceRanges: [
          { fromQuantity: 1, price: 189 },
          { fromQuantity: 2, price: 185 },
        ],
      },
      labels: {
        topLeft: [{ type: "REBUY_COUNT", count: 2 }],
        middleLeft: [],
        bottomLeft: [
          { type: "PROMOBOX_PROMO", discountId: "promo-1", labelText: "20% korting" },
          { type: "PROMO", labelText: "1+1 gratis" },
        ],
        topRight: [],
      },
      isOrganic: true,
      isNew: true,
      images: [{ id: "img-1" }, { id: "img-2" }, { id: "img-1" }],
      sellableInteraction: {
        slots: {
          stepperIncrementPress: {
            actions: [
              {
                type: "modify-cart",
                payload: {
                  modificationType: "ADD",
                  enrichments: [{ type: "PROMOTION", payload: { promotion_id: "promo-1", promotion_label: "20% korting" } }],
                },
              },
            ],
          },
        },
      },
    });

    expect(extractRscProductDetails("s1", content, "NL")).toMatchObject({
      id: "s1",
      name: "Halfvolle melk",
      brand: "Merk",
      unitQuantity: "1.5 liter",
      unitPrice: "€1.26/l",
      quantityBadges: [{ text: "XL", textColor: "#FFFFFF", backgroundColor: "#1F5FA8" }],
      tags: [{ text: "Diepvries", color: null }],
      displayPrice: 189,
      originalPrice: 229,
      displayPriceColor: "#B40117",
      priceRanges: [
        { price: 189, from_quantity: 1 },
        { price: 185, from_quantity: 2 },
      ],
      maxCount: 99,
      imageIds: ["img-1", "img-2"],
      // The app's order: organic, the promotion labels by type, new. It doesn't show REBUY_COUNT.
      labels: [
        { text: "Biologisch", textColor: "#4B8505", backgroundColor: "#FFFFFF" },
        { text: "1+1 gratis", textColor: "#333333", backgroundColor: "#FBD92B" },
        { text: "20% korting", textColor: "#FFFFFF", backgroundColor: "#295813" },
        { text: "Nieuw", textColor: "#4B8505", backgroundColor: "#F3F6E9" },
      ],
      promotion: { id: "promo-1", label: "20% korting" },
    });
  });

  it("reads a Family price, a price without tiers and the label texts of the country", () => {
    const content = rscProductPage({
      headerTitle: "Aardbeien",
      suffixes: [{ type: "TEXT", text: "400 gram" }],
      price: { priceValue: 4.04, referencePriceValue: 4.49, priceColor: "family", label: "FAMILY", priceRanges: [{ fromQuantity: 1, price: 404 }] },
      labels: { topLeft: [], middleLeft: [], bottomLeft: [], topRight: [] },
      isOrganic: true,
    });

    expect(extractRscProductDetails("s1", content, "DE")).toMatchObject({
      brand: null,
      displayPrice: 404,
      originalPrice: 449,
      displayPriceColor: "#3F7326",
      priceRanges: null,
      labels: [
        { text: "Bio", textColor: "#4B8505", backgroundColor: "#FFFFFF" },
        { text: "Family", textColor: "#FFFFFF", backgroundColor: "#295813" },
      ],
      promotion: null,
    });
  });

  it("reads the description, highlights, allergens, info sections and nutrition table", () => {
    const description = "Romige melk van **Nederlandse** koeien.\n\nLekker bij je ontbijt ☀️";
    const content = rscProductPage(
      {
        headerTitle: "Halfvolle melk",
        description: { main: "$9" },
        highlights: [
          { title: "Romig van smaak", titleMarkdown: "**Romig** van smaak", icon: "STARS", deeplink: "" },
          { title: "Meer melk", titleMarkdown: "Meer __**melk**__ >", icon: "PIN", deeplink: "app.picnic://store/page;id=theme-page-1" },
        ],
        allergies: { contains: [{ name: "Melk", color: "#6E8DB6" }], mayContain: ["Noten"] },
        accordions: [
          { id: "ingredients", icon: "list", title: "Ingrediënten", content: { type: "text", text: "Ingrediënten: melk." } },
          {
            id: "nutrition",
            icon: "apple",
            title: "Voedingswaarde",
            content: {
              type: "nutrition",
              unit: "per 100 ml",
              rows: [
                { label: "Energie", value: "206  kJ /", isSubValue: false },
                { label: "Vet", value: "1,5g", isSubValue: false },
                { label: "waarvan verzadigd", value: "1,0g", isSubValue: true },
              ],
            },
          },
          { id: "extra-information", icon: "infoMark", title: "Extra informatie", content: { type: "text", text: ["**Bewaren**\nKoel bewaren.", "**Land van herkomst**\nNederland"] } },
        ],
      },
      { "9": description },
    );

    const product = extractRscProductDetails("s1", content, "NL");

    expect(product.description).toBe(description);
    expect(product.highlightItems).toEqual([
      { text: "**Romig** van smaak", iconKey: "STARS", linkTarget: null },
      { text: "Meer __**melk**__ >", iconKey: "PIN", linkTarget: "app.picnic://store/page;id=theme-page-1" },
    ]);
    expect(product.allergenGroups).toEqual({
      contains: [{ text: "Melk", textColor: "#FFFFFF", backgroundColor: "#6E8DB6" }],
      mayContain: [{ text: "Noten", textColor: "#333333", backgroundColor: "transparent" }],
    });
    // Every other row is striped, starting with the first row under the heading.
    expect(product.nutritionRows).toEqual([
      { label: "Per 100 ml", value: null, isCategory: true, backgroundColor: null, amount: null, preference: null },
      { label: "Energie", value: "206  kJ /", isCategory: true, backgroundColor: "#FCFAF9", amount: 206, preference: "lower" },
      { label: "Vet", value: "1,5g", isCategory: true, backgroundColor: null, amount: 1.5, preference: "lower" },
      { label: "waarvan verzadigd", value: "1,0g", isCategory: false, backgroundColor: "#FCFAF9", amount: 1, preference: "lower" },
    ]);
    expect(product.infoSections).toEqual([
      { title: "Ingrediënten", content: "Ingrediënten: melk." },
      { title: "Voedingswaarde", content: "Per 100 ml\nEnergie\n206  kJ /\nVet\n1,5g\nwaarvan verzadigd\n1,0g" },
      { title: "Extra informatie", content: "**Bewaren**\nKoel bewaren.\n**Land van herkomst**\nNederland" },
    ]);
  });

  it("reads the similar products from the related tiles, with the brand in front of the name", () => {
    const tile = {
      type: "sellable",
      id: "s2",
      title: { title: "Pils", prefix: "$undefined" },
      subtitle: { text: "Merk" },
      images: { primaryImage: { imageId: "img-2" } },
      price: { priceValue: 4.5, priceRanges: [{ fromQuantity: 1, price: 450 }] },
      suffixes: [{ type: "TEXT", text: "6 x 300 ml" }],
      labels: {},
      unavailability: null,
      interaction: { context: { deposit: 60, sellableId: "s2" } },
    };
    const content = rscProductPage({ headerTitle: "Pils", related: [tile] });

    expect(extractRscProductDetails("s1", content, "NL").similarProducts).toEqual([
      {
        id: "s2",
        name: "Merk Pils",
        imageId: "img-2",
        displayPrice: 450,
        unitQuantity: "6 x 300 ml",
        comparisonPrice: { unit: "l", price: 250, lowestPrice: null },
        maxCount: 99,
        deposit: 60,
        priceRanges: [{ price: 450, from_quantity: 1 }],
      },
    ]);
  });

  it("throws a ProductNotFoundError when the page has no product", () => {
    const content = parseRscPageContent(
      "product-details-page-root?id=s0",
      parseRscPayload(['1:I["./presentational-components/page/page-route-provider.tsx",["c"],"PageRouteProvider"]', '0:["$","$L1",null,{"pageId":"product-details-page-root"}]'].join("\n")),
    );

    expect(() => extractRscProductDetails("s0", content, "NL")).toThrow(ProductNotFoundError);
  });
});
