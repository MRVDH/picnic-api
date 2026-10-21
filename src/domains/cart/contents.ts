import type { Decorator } from "../../types/common";
import type { PriceRange } from "../../pages/fusion";
import { extractDeliverySlots } from "./helpers";
import type { Cart, CartContents, CartDeposit, CartFee, CartLineItem, CartLineLabel, CartRecipe, CartReplacement, OrderLine } from "./types";

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawRecord) : null;
const asRecords = (value: unknown): RawRecord[] =>
  Array.isArray(value) ? value.flatMap((v): RawRecord[] => (asRecord(v) ? [asRecord(v)!] : [])) : [];
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" ? value : fallback);

/** Overrides replace the decorator of the same type; other overrides are added. */
function mergeDecorators(decorators: RawRecord[], overrides: RawRecord[]): RawRecord[] {
  const result = [...decorators];
  for (const override of overrides) {
    const index = result.findIndex((d) => d.type === override.type);
    if (index >= 0) result[index] = override;
    else result.push(override);
  }
  return result;
}

function readReplacement(raw: RawRecord): CartReplacement | null {
  const id = asString(raw.id);
  if (!id) return null;
  const imageIds = Array.isArray(raw.image_ids) ? raw.image_ids : [];
  return {
    id,
    name: asString(raw.name) ?? "",
    imageId: asString(imageIds[0]),
    displayPrice: asNumber(raw.display_price),
    unitQuantity: asString(raw.unit_quantity) ?? "",
    maxCount: asNumber(raw.max_count, 99),
  };
}

function readLabels(decorators: RawRecord[]): CartLineLabel[] {
  return decorators.flatMap((d) => {
    const text = asString(d.text);
    if ((d.type !== "PROMO" && d.type !== "LABEL") || !text) return [];
    return [{ text, textColor: asString(d.text_color), backgroundColor: asString(d.background_color) }];
  });
}

/**
 * Reads an order line. Its decorators are the article's, overridden by the line's, both after
 * applying `decorator_overrides` (keyed by line or article id). A `PRICE` decorator holds the
 * price after discounts.
 */
export function readCartLine(line: OrderLine, overrides: Record<string, Decorator[]> = {}): CartLineItem | null {
  const raw = line as unknown as RawRecord;
  const id = asString(raw.id);
  if (!id) return null;
  const article = asRecords(raw.items)[0];
  const articleId = asString(article?.id);
  const lineDecorators = mergeDecorators(asRecords(raw.decorators), asRecords(overrides[id]));
  const articleDecorators = article ? mergeDecorators(asRecords(article.decorators), asRecords(articleId ? overrides[articleId] : [])) : [];
  const decorators = mergeDecorators(articleDecorators, lineDecorators);
  const find = (type: string) => decorators.find((d) => d.type === type);

  const price = asNumber(raw.price);
  const displayPrice = asNumber(find("PRICE")?.display_price, asNumber(raw.display_price));
  const unavailable = find("UNAVAILABLE");
  const imageIds = Array.isArray(article?.image_ids) ? article!.image_ids : [];
  const priceRanges = Array.isArray(article?.price_ranges) && article!.price_ranges.length > 1 ? (article!.price_ranges as PriceRange[]) : null;

  return {
    id,
    productId: articleId ?? "",
    name: asString(article?.name) ?? asString(raw.name) ?? "",
    unitQuantity: asString(find("UNIT_QUANTITY")?.unit_quantity_text) ?? asString(article?.unit_quantity) ?? "",
    imageId: asString(imageIds[0]),
    quantity: asNumber(find("QUANTITY")?.quantity, 1),
    maxCount: asNumber(article?.max_count, 99),
    displayPrice,
    originalPrice: price > displayPrice ? price : null,
    priceColor: asString(find("PRICE_STYLE")?.price_color),
    priceRanges,
    labels: readLabels(decorators),
    basePrice: asString(find("BASE_PRICE")?.base_price_text),
    freshness: asString(find("FRESH_LABEL")?.period),
    characteristics: asRecords(find("PRODUCT_CHARACTERISTICS")?.characteristics).flatMap((c) => asString(c.type) ?? []),
    isUnavailable: unavailable !== undefined,
    unavailableReason: asString(asRecord(unavailable?.explanation)?.short_explanation),
    replacements: asRecords(unavailable?.replacements).flatMap((r) => readReplacement(r) ?? []),
    bundlesLink: asString(find("BUNDLES_BUTTON")?.deeplink),
    recipeId: asString(lineDecorators.find((d) => d.type === "BASKET_GROUP")?.id),
  };
}

function readRecipes(sections: unknown): CartRecipe[] {
  return asRecords(sections).flatMap((section) =>
    asRecords(section.groups).flatMap((group) => {
      const id = asString(group.id);
      if (!id) return [];
      return [{ id, title: asString(group.title) ?? "", preTitle: asString(group.pre_title), subtitle: asString(group.subtitle), imageId: asString(group.image_id) }];
    })
  );
}

/** Reads a deposit breakdown (`deposit_breakdown`), with the total per kind of container. */
export function readDeposits(raw: unknown): CartDeposit[] {
  return asRecords(raw).map((entry) => {
    const value = asNumber(entry.value);
    const count = asNumber(entry.count);
    return { type: asString(entry.type) ?? "", value, count, total: value * count };
  });
}

/** Reads the fees and credits that aren't zero. */
export function readFees(raw: unknown): CartFee[] {
  return asRecords(raw)
    .map((fee) => ({ type: asString(fee.type) ?? "", name: asString(fee.name) ?? "", amount: asNumber(fee.amount) }))
    .filter((fee) => fee.amount !== 0);
}

/** Turns a cart response (from {@link CartService.getCart} or a cart mutation) into {@link CartContents}. */
export function extractCartContents(cart: Cart): CartContents {
  const overrides = cart.decorator_overrides ?? {};
  const items = (cart.items ?? []).flatMap((line) => readCartLine(line, overrides) ?? []);
  const deposits = readDeposits(cart.deposit_breakdown);
  const fees = readFees(cart.fees);
  const slots = extractDeliverySlots({ delivery_slots: cart.delivery_slots ?? [], selected_slot: cart.selected_slot ?? null });
  const selectedSlot = slots.selectedSlot;

  return {
    items,
    totalCount: asNumber(cart.total_count),
    totalPrice: asNumber(cart.checkout_total_price),
    discount: items.reduce((sum, item) => sum + (item.originalPrice !== null ? item.originalPrice - item.displayPrice : 0), 0),
    promotionSavings: asNumber(cart.total_savings),
    membershipSavings: asNumber(cart.membership_savings),
    deposits,
    depositTotal: deposits.reduce((sum, deposit) => sum + deposit.total, 0),
    fees,
    minimumOrderValue: slots.slots.find((slot) => slot.slotId === selectedSlot?.slotId)?.minimumOrderValue ?? null,
    selectedSlot,
    recipes: readRecipes(cart.basket_sections),
  };
}
