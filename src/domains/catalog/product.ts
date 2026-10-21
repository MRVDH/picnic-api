import type { FusionPage, PriceRange } from "../../pages/fusion";
import { ProductNotFoundError } from "../../errors/product-not-found-error";
import {
  accordionItems,
  childrenOf,
  cleanMarkdown,
  collectBadges,
  collectMarkdowns,
  collectNutritionRows,
  collectPriceNodes,
  collectPropertyValues,
  extractHighlightColor,
  findNode,
  findNodeById,
  findNodeByIdPrefix,
  findPmlComponent,
  isDefaultTextColor,
  PmlNode,
  stripColorTags,
  walkNodes,
} from "../../pages/pml";
import type {
  NutritionRow,
  ProductAllergens,
  ProductBadge,
  Product,
  ProductHighlight,
  ProductInfoSection,
  ProductPromotion,
  ProductTag,
  SimilarProduct,
} from "./types";

const MAIN_CONTAINER_ID = "product-details-page-root-main-container";
const GALLERY_ID = "product-page-image-gallery-main-image-container";
const LABELS_PREFIX = "product-page-labels-";
const DESCRIPTION_ID = "description";
const HIGHLIGHTS_ID = "product-page-highlights";
const ALLERGIES_ID = "product-page-allergies";
const ACCORDION_ID = "accordion-list";
const ALTERNATIVES_ID = "alternatives-container";

/** Allergen group headings: "Bevat" / "Enthält" / "Contient". */
const CONTAINS_HEADING = /^(bevat|enthält|contient)$/i;
/** "Bevat mogelijk" / "Kann enthalten" / "Peut contenir". */
const MAY_CONTAIN_HEADING = /^(bevat\s+mogelijk|kann\s+enthalten|peut\s+contenir)$/i;
/** Titles of the nutrition section in the info accordion. */
const NUTRITION_TITLE = /voedingswaarde|nährwert|valeurs nutritionnelles/i;

/**
 * Extracts structured product details from a `product-details-page-root` Fusion page.
 *
 * The header (name, brand, quantity, prices) is read from the main container's layout: the name is
 * the `HEADER1` text, followed by the brand, a row with badges, the unit quantity, the unit price
 * and tags, and the prices. Price tiers are read from the main container only; the page also holds
 * the tiers of similar products.
 * @param {string} productId The product ID that was requested.
 * @param {FusionPage} page The raw Fusion page response.
 */
export function extractProductDetails(productId: string, page: FusionPage): Product {
  const mainContainer = findNodeById(page, MAIN_CONTAINER_ID);
  if (!mainContainer) throw new ProductNotFoundError(productId);
  const header = extractHeader(mainContainer);
  const mainUnit = findMainSellingUnit(page, productId);
  const prices = extractPrices(mainContainer, mainUnit);
  const labels = collectBadges(findNodeByIdPrefix(page, LABELS_PREFIX));
  const highlightItems = collectHighlights(findNodeById(page, HIGHLIGHTS_ID));
  const allergenGroups = extractAllergens(page);

  return {
    id: productId,
    ...header,
    ...prices,
    maxCount: typeof mainUnit?.max_count === "number" ? mainUnit.max_count : 99,
    imageIds: extractImageIds(page, mainUnit),
    labels,
    description: extractDescription(page),
    highlightItems,
    allergenGroups,
    infoSections: extractInfoSections(page),
    nutritionRows: extractNutritionRows(page),
    promotion: extractPromotion(labels, page),
    similarProducts: extractSimilarProducts(page),
  };
}

/** The main selling unit: the one with the requested id that carries a max count. */
function findMainSellingUnit(page: unknown, productId: string): PmlNode | null {
  const units = collectPropertyValues(page, "sellingUnit").filter((u): u is PmlNode => typeof u === "object" && u !== null);
  return units.find((u) => u.id === productId && u.max_count !== undefined) ?? units.find((u) => u.id === productId) ?? null;
}

type Header = Pick<Product, "name" | "brand" | "unitQuantity" | "unitPrice" | "quantityBadges" | "tags">;

/**
 * Reads the header of the main container. Its stack holds: a container with the `HEADER1` name,
 * the brand text, a row (stack) with badge containers ("XL") and the texts unit quantity, unit
 * price (an expression when the app computes it) and tags ("Diepvries"), then the prices.
 */
function extractHeader(mainContainer: PmlNode | null): Header {
  const nameNode = findNode(mainContainer, (n) => n.type === "RICH_TEXT" && n.textType === "HEADER1");
  const stack = findPmlComponent(mainContainer);
  const parts = stack ? childrenOf(stack) : [];

  const brandNode = parts.find((n) => n.type === "RICH_TEXT" && typeof n.markdown === "string");
  const row = parts.find((n) => n.type === "STACK" && childrenOf(n).some((c) => c.type === "RICH_TEXT"));
  const rowItems = row ? childrenOf(row) : [];

  const quantityBadges = collectBadges(rowItems.filter((n) => n.type === "CONTAINER"));
  // Texts in order: unit quantity, unit price, tags. A computed unit price has no markdown.
  const texts = rowItems.filter((n) => n.type === "RICH_TEXT");
  const markdownOf = (n: PmlNode | undefined) => (typeof n?.markdown === "string" ? n.markdown : null);
  const tags: ProductTag[] = texts.slice(2).flatMap((n) => {
    const markdown = markdownOf(n);
    const text = markdown ? cleanMarkdown(markdown) : "";
    return text ? [{ text, color: extractHighlightColor(markdown!) ?? innerColor(markdown!) }] : [];
  });
  const unitPrice = markdownOf(texts[1]) ?? computeUnitPrice(texts[1]?.markdown);

  return {
    name: nameNode && typeof nameNode.markdown === "string" ? cleanMarkdown(nameNode.markdown) : "",
    brand: brandNode ? cleanMarkdown(brandNode.markdown as string) || null : null,
    unitQuantity: cleanMarkdown(markdownOf(texts[0]) ?? ""),
    unitPrice: unitPrice ? cleanMarkdown(unitPrice) || null : null,
    quantityBadges,
    tags,
  };
}

/**
 * Computes the unit price that a tier product shows: an expression whose parameters are the unit
 * factor (`v1`), the currency (`v2`), the unit suffix (`v3`) and the tiers. The app multiplies the
 * price of the tier for the quantity in the cart by the factor; this uses the first tier.
 */
function computeUnitPrice(expression: unknown): string | null {
  const props = typeof expression === "object" && expression !== null ? ((expression as PmlNode).props as PmlNode | undefined) : undefined;
  const tiers = findPriceTiers(props);
  if (!props || !tiers || typeof props.v1 !== "number" || typeof props.v2 !== "string" || typeof props.v3 !== "string") return null;
  const firstTier = [...tiers].sort((a, b) => a.from_quantity - b.from_quantity)[0];
  return props.v2 + ((props.v1 * firstTier.price) / 100).toFixed(2) + props.v3;
}

/** The innermost color tag of a markdown text, e.g. `#5b534e` for "Diepvries", or `null`. */
function innerColor(markdown: string): string | null {
  const colors = [...markdown.matchAll(/#\(([^)]+)\)/g)].map((m) => m[1]);
  return colors.length > 0 ? colors[Math.floor((colors.length - 1) / 2)] : null;
}

type Prices = Pick<Product, "displayPrice" | "originalPrice" | "displayPriceColor" | "priceRanges">;

/**
 * Reads the prices from the main container. A plain price is a `PRICE` component, crossed out for
 * the original price. A product with price tiers shows the tiers instead, computed by expressions
 * whose parameters hold the tier list (`{ price, from_quantity }`).
 */
function extractPrices(mainContainer: PmlNode | null, mainUnit: PmlNode | null): Prices {
  const priceNodes = collectPriceNodes(mainContainer);
  const active = priceNodes.find((p) => !p.isCrossed);
  const crossed = priceNodes.find((p) => p.isCrossed);
  const priceRanges = findPriceTiers(mainContainer) ?? (Array.isArray(mainUnit?.price_ranges) && mainUnit!.price_ranges.length > 0 ? (mainUnit!.price_ranges as PriceRange[]) : null);
  const lowestTier = priceRanges ? [...priceRanges].sort((a, b) => a.from_quantity - b.from_quantity)[0] : undefined;
  const unitPrice = typeof mainUnit?.display_price === "number" ? mainUnit.display_price : undefined;

  return {
    displayPrice: active?.price ?? lowestTier?.price ?? unitPrice ?? 0,
    originalPrice: crossed?.price ?? null,
    displayPriceColor: active?.color && !isDefaultTextColor(active.color) ? active.color : null,
    priceRanges,
  };
}

/** The first tier list (an array of `{ price, from_quantity }`) in a subtree, or `null`. */
function findPriceTiers(node: unknown): PriceRange[] | null {
  let tiers: PriceRange[] | null = null;
  walkNodes(node, (n) => {
    if (tiers) return;
    for (const value of Object.values(n)) {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((tier) => typeof tier?.price === "number" && typeof tier?.from_quantity === "number")
      ) {
        tiers = value.map((tier) => ({ price: tier.price, from_quantity: tier.from_quantity }));
        return;
      }
    }
  });
  return tiers;
}

function extractImageIds(page: unknown, mainUnit: PmlNode | null): string[] {
  const ids = collectPropertyValues(findNodeById(page, GALLERY_ID), "source")
    .map((source) => (typeof source === "object" && source !== null ? (source as PmlNode).id : undefined))
    .filter((id): id is string => typeof id === "string");
  if (ids.length > 0) return [...new Set(ids)];
  return typeof mainUnit?.image_id === "string" && mainUnit.image_id ? [mainUnit.image_id] : [];
}

function extractDescription(page: unknown): string | null {
  const markdowns = collectMarkdowns(findNodeById(page, DESCRIPTION_ID));
  return markdowns.length > 0 ? markdowns.join("\n") : null;
}

/**
 * Collects the highlight rows: horizontal stacks with an icon and a text. A row wrapped in a
 * `TOUCHABLE` with an `OPEN` action links to its target.
 */
function collectHighlights(node: unknown, linkTarget: string | null = null): ProductHighlight[] {
  if (Array.isArray(node)) return node.flatMap((child) => collectHighlights(child, linkTarget));
  if (typeof node !== "object" || node === null) return [];
  const record = node as PmlNode;

  if (record.type === "STACK" && record.axis === "HORIZONTAL") {
    const children = childrenOf(record);
    const text = children.find((c) => c.type === "RICH_TEXT" && typeof c.markdown === "string");
    if (text) {
      const icon = children.find((c) => c.type === "ICON");
      return [{ text: text.markdown as string, iconKey: typeof icon?.iconKey === "string" ? icon.iconKey : null, linkTarget }];
    }
  }
  if (record.type === "TOUCHABLE") {
    const onPress = record.onPress as PmlNode | undefined;
    const target = onPress?.actionType === "OPEN" && typeof onPress.target === "string" ? onPress.target : null;
    return collectHighlights(record.child, target);
  }
  const pml = record.pml as PmlNode | undefined;
  return [...childrenOf(record).flatMap((child) => collectHighlights(child, linkTarget)), ...(pml?.component ? collectHighlights(pml.component, linkTarget) : [])];
}

/** Reads the allergen badges, grouped under their "Bevat" and "Bevat mogelijk" headings. */
function extractAllergens(page: unknown): ProductAllergens {
  const allergens: ProductAllergens = { contains: [], mayContain: [] };
  const component = findPmlComponent(findNodeById(page, ALLERGIES_ID));
  let group: ProductBadge[] = allergens.contains;
  for (const child of component ? childrenOf(component) : []) {
    if (child.type === "RICH_TEXT" && typeof child.markdown === "string") {
      const heading = stripColorTags(child.markdown);
      if (MAY_CONTAIN_HEADING.test(heading)) group = allergens.mayContain;
      else if (CONTAINS_HEADING.test(heading)) group = allergens.contains;
    } else if (child.type === "STACK" && child.axis === "HORIZONTAL") {
      group.push(...collectBadges(child));
    }
  }
  return allergens;
}

function extractInfoSections(page: unknown): ProductInfoSection[] {
  return accordionItems(findNodeById(page, ACCORDION_ID)).flatMap((item) => {
    const title = collectMarkdowns(item.header).map(cleanMarkdown)[0] ?? "";
    const content = collectMarkdowns(item.body).map(stripColorTags).join("\n");
    return title ? [{ title, content }] : [];
  });
}

/**
 * Reads the nutrition table from the nutrition accordion item. Each row is a horizontal stack with
 * a label and a value; main nutrients are `HEADLINE2` texts.
 */
function extractNutritionRows(page: unknown): NutritionRow[] {
  const item = accordionItems(findNodeById(page, ACCORDION_ID)).find((i) => NUTRITION_TITLE.test(collectMarkdowns(i.header).map(cleanMarkdown)[0] ?? ""));
  return item ? collectNutritionRows(item.body) : [];
}

/**
 * The promotion of the product. The page shows it only as a badge in the product's labels; the
 * promotion id is on the tiles of other products in the same promotion ("Meer met korting").
 * Returns the promotion of those tiles whose label matches one of the product's labels, or `null`.
 */
function extractPromotion(labels: ProductBadge[], page: unknown): ProductPromotion | null {
  const labelTexts = new Set(labels.map((label) => label.text));
  const tile = findNode(
    page,
    (n) => typeof n.promotion_id === "string" && typeof n.promotion_label === "string" && labelTexts.has(n.promotion_label)
  );
  return tile ? { id: tile.promotion_id as string, label: tile.promotion_label as string } : null;
}

function extractSimilarProducts(page: unknown): SimilarProduct[] {
  return collectPropertyValues(findNodeById(page, ALTERNATIVES_ID), "sellingUnit")
    .filter((u): u is PmlNode => typeof u === "object" && u !== null)
    .filter((u) => u.display_price !== undefined)
    .map((u) => ({
      id: String(u.id ?? ""),
      name: String(u.name ?? ""),
      imageId: String(u.image_id ?? ""),
      displayPrice: Number(u.display_price ?? 0),
      unitQuantity: String(u.unit_quantity ?? ""),
      maxCount: Number(u.max_count ?? 0),
      ...(u.deposit !== undefined ? { deposit: Number(u.deposit) } : {}),
      ...(Array.isArray(u.price_ranges) ? { priceRanges: u.price_ranges as PriceRange[] } : {}),
    }));
}

/** The id of a product's details page, with the parameters the app sends. */
export function productDetailsPageId(productId: string): string {
  return `product-details-page-root?id=${encodeURIComponent(productId)}&show_category_action=true&show_remove_from_purchases_page_action=true`;
}
