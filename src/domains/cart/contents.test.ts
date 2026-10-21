import { extractCartContents } from "./contents";
import type { Cart } from "./types";

const article = (id: string, extra: Record<string, unknown> = {}) => ({
  type: "ORDER_ARTICLE",
  id,
  name: `Product ${id}`,
  unit_quantity: "500 gram",
  price: 199,
  max_count: 50,
  image_ids: [`image-${id}`],
  decorators: [{ type: "QUANTITY", quantity: 1 }],
  ...extra,
});

const cart = (extra: Partial<Record<keyof Cart, unknown>> = {}) =>
  ({
    type: "ORDER",
    id: "cart",
    items: [],
    delivery_slots: [
      { slot_id: "slot-1", window_start: "2026-10-22T21:00:00.000+02:00", window_end: "2026-10-22T22:00:00.000+02:00", minimum_order_value: 4500 },
      { slot_id: "slot-2", window_start: "2026-10-23T08:00:00.000+02:00", window_end: "2026-10-23T09:00:00.000+02:00", minimum_order_value: 3500 },
    ],
    selected_slot: { slot_id: "slot-2", state: "EXPLICIT" },
    total_count: 3,
    total_price: 1000,
    checkout_total_price: 1050,
    total_savings: 30,
    membership_savings: 20,
    deposit_breakdown: [{ type: "BAG", value: 25, count: 2 }],
    decorator_overrides: {},
    fees: [{ type: "SALDO", name: "Verrekening", amount: -100 }, { type: "OTHER", name: "Zero", amount: 0 }],
    basket_sections: [{ title: "Koken", groups: [{ id: "recipe-1", title: "Traybake", pre_title: "2 porties", subtitle: "6 ingrediënten", image_id: "recipes/1" }] }],
    ...extra,
  }) as unknown as Cart;

describe("extractCartContents", () => {
  it("applies the decorator overrides of the line and the article", () => {
    const contents = extractCartContents(
      cart({
        items: [
          {
            type: "ORDER_LINE",
            id: "line-1",
            price: 398,
            display_price: 398,
            decorators: [{ type: "BASKET_GROUP", id: "recipe-1" }],
            items: [article("s1", { price_ranges: [{ price: 199, from_quantity: 1 }, { price: 189, from_quantity: 2 }] })],
          },
        ],
        decorator_overrides: {
          "line-1": [{ type: "PROMO", text: "Family", background_color: "#295813", text_color: "#FFFFFF" }],
          s1: [
            { type: "QUANTITY", quantity: 2 },
            { type: "PRICE", display_price: 358 },
            { type: "PRICE_STYLE", price_color: "RED2" },
            { type: "UNIT_QUANTITY", unit_quantity_text: "2 x 250 gram" },
            { type: "PRODUCT_CHARACTERISTICS", characteristics: [{ type: "ORGANIC" }] },
            { type: "BUNDLES_BUTTON", deeplink: "app.picnic://bundles", icon_color: "#FFFFFF", background_color: "#295813" },
          ],
        },
      })
    );

    expect(contents.items).toEqual([
      {
        id: "line-1",
        productId: "s1",
        name: "Product s1",
        unitQuantity: "2 x 250 gram",
        imageId: "image-s1",
        quantity: 2,
        maxCount: 50,
        displayPrice: 358,
        originalPrice: 398,
        priceColor: "RED2",
        priceRanges: [{ price: 199, from_quantity: 1 }, { price: 189, from_quantity: 2 }],
        labels: [{ text: "Family", textColor: "#FFFFFF", backgroundColor: "#295813" }],
        basePrice: null,
        freshness: null,
        characteristics: ["ORGANIC"],
        isUnavailable: false,
        unavailableReason: null,
        replacements: [],
        bundlesLink: "app.picnic://bundles",
        recipeId: "recipe-1",
      },
    ]);
    expect(contents.discount).toBe(40);
  });

  it("reads an unavailable line with its replacements", () => {
    const unavailable = {
      type: "UNAVAILABLE",
      reason: "OUT_OF_STOCK",
      explanation: { short_explanation: "Niet leverbaar" },
      replacements: [{ id: "s3", name: "Other", image_ids: ["image-s3"], display_price: 149, unit_quantity: "1 liter", max_count: 24 }],
    };
    const contents = extractCartContents(
      cart({ items: [{ type: "ORDER_LINE", id: "line-2", price: 199, display_price: 199, items: [article("s2", { decorators: [unavailable] })] }] })
    );

    expect(contents.items[0]).toMatchObject({
      isUnavailable: true,
      unavailableReason: "Niet leverbaar",
      replacements: [{ id: "s3", name: "Other", imageId: "image-s3", displayPrice: 149, unitQuantity: "1 liter", maxCount: 24 }],
      originalPrice: null,
    });
  });

  it("reads the totals, deposits, fees, the selected slot and the recipes", () => {
    const contents = extractCartContents(cart());

    expect(contents).toMatchObject({
      totalCount: 3,
      totalPrice: 1050,
      promotionSavings: 30,
      membershipSavings: 20,
      deposits: [{ type: "BAG", value: 25, count: 2, total: 50 }],
      depositTotal: 50,
      fees: [{ type: "SALDO", name: "Verrekening", amount: -100 }],
      minimumOrderValue: 3500,
      selectedSlot: { slotId: "slot-2", isExplicitSelection: true, windowStart: "2026-10-23T08:00:00.000+02:00" },
      recipes: [{ id: "recipe-1", title: "Traybake", preTitle: "2 porties", subtitle: "6 ingrediënten", imageId: "recipes/1" }],
    });
  });
});
