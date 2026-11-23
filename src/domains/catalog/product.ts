import { RawRecord, asArray, asString, recordOf } from "../../raw";
import type { FusionPage, PriceRange } from "../../pages/fusion";
import type { RscPageContent } from "../../pages/types";
import { findRscNode } from "../../pages/rsc";
import type { CountryCode } from "../../types/common";
import { ProductNotFoundError } from "../../errors/product-not-found-error";
import { getComparisonPrice } from "./comparison-price";
import { readNutritionRows } from "./nutrition";
import { readRscPriceRanges, tileQuantity, toCents } from "./search";
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
  PmlNutritionRow,
  stripColorTags,
  walkNodes,
} from "../../pages/pml";
import type { NutritionRow, ProductAllergens, ProductBadge, Product, ProductHighlight, ProductInfoSection, ProductPromotion, ProductTag, ProductTile, SimilarProduct } from "./types";

/** The max count of a product whose page doesn't send one. */
const DEFAULT_MAX_COUNT = 99;

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
    comparisonPrice: getComparisonPrice(prices.displayPrice, header.unitQuantity, prices.priceRanges),
    maxCount: typeof mainUnit?.max_count === "number" ? mainUnit.max_count : DEFAULT_MAX_COUNT,
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
 * whose parameters hold the tier list (`{ price, from_quantity }`), or as one tile per tier
 * ("1 stuk 2.75", "Vanaf 2 2.69") whose expressions each hold their own tier.
 */
function extractPrices(mainContainer: PmlNode | null, mainUnit: PmlNode | null): Prices {
  const priceNodes = collectPriceNodes(mainContainer);
  const active = priceNodes.find((p) => !p.isCrossed);
  const crossed = priceNodes.find((p) => p.isCrossed);
  const priceRanges =
    findPriceTiers(mainContainer) ?? collectTierTiles(mainContainer) ?? (Array.isArray(mainUnit?.price_ranges) && mainUnit!.price_ranges.length > 0 ? (mainUnit!.price_ranges as PriceRange[]) : null);
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
      if (Array.isArray(value) && value.length > 0 && value.every((tier) => typeof tier?.price === "number" && typeof tier?.from_quantity === "number")) {
        tiers = value.map((tier) => ({ price: tier.price, from_quantity: tier.from_quantity }));
        return;
      }
    }
  });
  return tiers;
}

/**
 * The tiers of tier tiles in a subtree: every `{ price, from_quantity }` object, once per quantity,
 * sorted by quantity. `null` when there are none.
 */
function collectTierTiles(node: unknown): PriceRange[] | null {
  const byQuantity = new Map<number, PriceRange>();
  walkNodes(node, (n) => {
    if (typeof n.price === "number" && typeof n.from_quantity === "number" && !byQuantity.has(n.from_quantity)) {
      byQuantity.set(n.from_quantity, { price: n.price, from_quantity: n.from_quantity });
    }
  });
  return byQuantity.size > 0 ? [...byQuantity.values()].sort((a, b) => a.from_quantity - b.from_quantity) : null;
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
  return item ? readNutritionRows(collectNutritionRows(item.body)) : [];
}

/**
 * The promotion of the product. The page shows it only as a badge in the product's labels; the
 * promotion id is on the tiles of other products in the same promotion ("Meer met korting").
 * Returns the promotion of those tiles whose label matches one of the product's labels, or `null`.
 */
function extractPromotion(labels: ProductBadge[], page: unknown): ProductPromotion | null {
  const labelTexts = new Set(labels.map((label) => label.text));
  const tile = findNode(page, (n) => typeof n.promotion_id === "string" && typeof n.promotion_label === "string" && labelTexts.has(n.promotion_label));
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
      comparisonPrice: getComparisonPrice(Number(u.display_price ?? 0), String(u.unit_quantity ?? ""), Array.isArray(u.price_ranges) ? (u.price_ranges as PriceRange[]) : null),
      maxCount: Number(u.max_count ?? 0),
      ...(u.deposit !== undefined ? { deposit: Number(u.deposit) } : {}),
      ...(Array.isArray(u.price_ranges) ? { priceRanges: u.price_ranges as PriceRange[] } : {}),
    }));
}

// ─── RSC page ─────────────────────────────────────────────────────────────────

const asNumber = (value: unknown): number | null => (typeof value === "number" ? value : null);

/** The app's texts for the organic and new labels and the nutrition table header, per country. */
const RSC_COPY: Record<CountryCode, { organic: string; new: string; per: string }> = {
  NL: { organic: "Biologisch", new: "Nieuw", per: "Per" },
  DE: { organic: "Bio", new: "Neu", per: "Pro" },
  FR: { organic: "Biologique", new: "Nouveau", per: "Pour" },
};

/**
 * The label types the app shows on the product page, in its order. BABY, CURRENTLY_ORDERED and
 * LOYALTY labels are left out until one has been seen; others (REBUY_COUNT) the page doesn't show.
 */
const RSC_LABEL_ORDER: Record<string, number> = { PROMO: 6, PROMOBOX_PROMO: 7 };
const LABEL_POSITIONS = ["topLeft", "middleLeft", "bottomLeft", "topRight"];
/** The suffix types the app shows as notes after the quantity; a `TEXT` is a note when it isn't the first. */
const NOTE_SUFFIXES = ["TEXT", "NOTICE_LABEL", "TEXT_ICON"];

/** The colors the app gives the parts it draws, as theme tokens with the values they have in the app's theme. */
const RSC_COLORS = {
  white: ["Text/Negative/primary", "#FFFFFF"],
  text: ["Text/Default/primary", "#333333"],
  promoText: ["Colour/Neutral/neutral-800", "#333333"],
  promoBackground: ["Background/Brand/bg-promo-primary", "#FBD92B"],
  green: ["Colour/Green/green-700", "#295813"],
  sizeText: ["Colour/Neutral/neutral-white", "#FFFFFF"],
  nutritionStripe: ["Colour/Neutral/neutral-50", "#FCFAF9"],
  promoPrice: ["Text/Brand/price", "#B40117"],
  familyPrice: ["Colour/Green/green-500", "#3F7326"],
} as const;

/**
 * Extracts structured product details from a `product-details-page-root` RSC page. The page is one
 * `product-details-content` component whose `viewModel` prop holds the product; this reads it the
 * way the app's component shows it:
 *
 * - The header: the name without the brand (`headerTitle`), the brand (`subtitle`), and the
 *   `suffixes`: the quantity (the first `TEXT`), the unit price (`UNIT_PRICE`), size badges (`SIZE`)
 *   and notes such as "In prijs verlaagd" (a later `TEXT`) and "Diepvries" (`NOTICE_LABEL`, `TEXT_ICON`).
 * - The labels: organic, the promotion labels, "Family" for a Family price, and new.
 * - The accordions: text sections and nutrition tables.
 * - The promotion: the one the app sends along when the product is added to the cart.
 * - The similar products: the `related` product tiles.
 *
 * The page has no max count; the cart enforces it. `maxCount` is 99.
 * @param {string} productId The product ID that was requested.
 * @param {RscPageContent} content The content of the product page.
 * @param {CountryCode} countryCode The country, for the label texts the app adds.
 * @throws {ProductNotFoundError} When Picnic shows its "product not found" content instead.
 * @throws {Error} When the page has neither component.
 */
export function extractRscProductDetails(productId: string, content: RscPageContent, countryCode: CountryCode): Product {
  const viewModel = findRscNode(content.nodes, "product-details-content")?.props.viewModel;
  if (typeof viewModel !== "object" || viewModel === null || Array.isArray(viewModel)) {
    if (findRscNode(content.nodes, "product-details-fallback-content")) throw new ProductNotFoundError(productId);
    throw new Error(`The product page "${content.pageId}" has no product-details-content or product-details-fallback-content component.`);
  }
  const vm = recordOf(viewModel);
  const copy = RSC_COPY[countryCode] ?? RSC_COPY.NL;
  const color = (name: keyof typeof RSC_COLORS): string => content.tokens[RSC_COLORS[name][0]] ?? RSC_COLORS[name][1];

  const suffixes = asArray(vm.suffixes).map(recordOf);
  const suffixTexts = (...types: string[]) => suffixes.filter((s) => types.includes(String(s.type))).flatMap((s) => asString(s.text) ?? []);
  // The first text is the quantity; texts after it are notes, which the app shows after it like the other notes.
  const quantitySuffix = suffixes.find((s) => s.type === "TEXT" && asString(s.text) !== null);
  const unitQuantity = asString(quantitySuffix?.text) ?? "";
  const notes = suffixes.filter((s) => s !== quantitySuffix && NOTE_SUFFIXES.includes(String(s.type))).flatMap((s) => asString(s.text) ?? []);
  const productColor = asString(recordOf(vm.color).primary);

  const price = recordOf(vm.price);
  const ranges = readRscPriceRanges(price.priceRanges);
  // Every product has its own price as a range from 1; it has tiers when there are more.
  const priceRanges = ranges.length > 1 ? ranges : null;
  // The page's own price; the lowest-quantity tier when it has none.
  const displayPrice = toCents(price.priceValue) ?? asNumber(price.basePrice) ?? ranges[0]?.price ?? 0;
  const priceColor = price.priceColor === "promo" ? color("promoPrice") : price.priceColor === "family" ? color("familyPrice") : null;

  const accordions = asArray(vm.accordions).map(recordOf);
  const readNutrition = (section: RawRecord) => readRscNutritionRows(section, copy.per, color("nutritionStripe"));
  // The model has one nutrition table: the first. Every nutrition accordion keeps its own text in the info sections.
  const nutritionContent = accordions.map((a) => recordOf(a.content)).find((c) => c.type === "nutrition");

  return {
    id: productId,
    name: asString(vm.headerTitle) ?? asString(vm.title) ?? "",
    brand: asString(vm.subtitle),
    unitQuantity,
    unitPrice: suffixTexts("UNIT_PRICE")[0] ?? null,
    quantityBadges: suffixTexts("SIZE").map((text) => ({ text, textColor: color("sizeText"), backgroundColor: productColor ?? color("text") })),
    tags: notes.map((text) => ({ text, color: null })),
    displayPrice,
    originalPrice: toCents(price.referencePriceValue),
    displayPriceColor: priceColor,
    priceRanges,
    comparisonPrice: getComparisonPrice(displayPrice, unitQuantity, priceRanges),
    maxCount: DEFAULT_MAX_COUNT,
    imageIds: [...new Set(asArray(vm.images).flatMap((image) => asString(recordOf(image).id) ?? []))],
    labels: readRscLabels(vm, copy, color),
    description: asString(recordOf(vm.description).main),
    highlightItems: asArray(vm.highlights).flatMap((value): ProductHighlight[] => {
      const highlight = recordOf(value);
      const text = asString(highlight.titleMarkdown) ?? asString(highlight.title);
      return text ? [{ text, iconKey: asString(highlight.icon), linkTarget: asString(highlight.deeplink) }] : [];
    }),
    allergenGroups: readRscAllergens(recordOf(vm.allergies), color),
    infoSections: accordions.flatMap((accordion): ProductInfoSection[] => {
      const title = asString(accordion.title);
      const section = recordOf(accordion.content);
      const text = section.type === "nutrition" ? nutritionText(readNutrition(section)) : accordionText(section);
      return title && text ? [{ title, content: text }] : [];
    }),
    nutritionRows: nutritionContent ? readNutrition(nutritionContent) : [],
    promotion: readRscPromotion(vm),
    similarProducts: asArray(vm.related).filter(isProductTile).map(toSimilarProduct),
  };
}

/**
 * The labels in the app's order: organic, the promotion labels (sorted by type), "Family" when the
 * price is a Family price, and new. Their colors are the ones the app draws them in.
 */
function readRscLabels(vm: RawRecord, copy: { organic: string; new: string }, color: (name: keyof typeof RSC_COLORS) => string): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if (vm.isOrganic === true) badges.push({ text: copy.organic, textColor: "#4B8505", backgroundColor: "#FFFFFF" });

  const labels = recordOf(vm.labels);
  const shown = LABEL_POSITIONS.flatMap((position) => asArray(labels[position]).map(recordOf))
    .filter((label) => RSC_LABEL_ORDER[String(label.type)] !== undefined)
    .sort((a, b) => RSC_LABEL_ORDER[String(a.type)] - RSC_LABEL_ORDER[String(b.type)]);
  for (const label of shown) {
    const text = asString(label.labelText);
    if (!text) continue;
    badges.push(
      label.type === "PROMOBOX_PROMO" ? { text, textColor: color("white"), backgroundColor: color("green") } : { text, textColor: color("promoText"), backgroundColor: color("promoBackground") },
    );
  }

  if (recordOf(vm.price).label === "FAMILY") badges.push({ text: "Family", textColor: color("white"), backgroundColor: color("green") });
  if (vm.isNew === true) badges.push({ text: copy.new, textColor: "#4B8505", backgroundColor: "#F3F6E9" });
  return badges;
}

/** "Contains" allergens are chips in the allergen's color; "may contain" ones are plain text. */
function readRscAllergens(allergies: RawRecord, color: (name: keyof typeof RSC_COLORS) => string): ProductAllergens {
  return {
    contains: asArray(allergies.contains).flatMap((value): ProductBadge[] => {
      const allergen = recordOf(value);
      const text = asString(allergen.name);
      return text ? [{ text, textColor: color("white"), backgroundColor: asString(allergen.color) ?? color("text") }] : [];
    }),
    mayContain: asArray(allergies.mayContain).flatMap((value): ProductBadge[] => {
      const text = asString(value);
      return text ? [{ text, textColor: color("text"), backgroundColor: "transparent" }] : [];
    }),
  };
}

/**
 * Reads the nutrition table of a `nutrition` accordion: a heading row with the unit ("Per 100 g"),
 * then the rows, every other one striped as the app draws them. Sub-values ("waarvan suikers") are
 * the rows that aren't categories.
 */
function readRscNutritionRows(content: RawRecord, per: string, stripe: string): NutritionRow[] {
  const unit = asString(content.unit);
  const heading: PmlNutritionRow[] = unit ? [{ label: `${per} ${unit.replace(new RegExp(`^${per}\\s+`, "i"), "")}`, value: null, isCategory: true, backgroundColor: null }] : [];
  const rows = asArray(content.rows).flatMap((value, index): PmlNutritionRow[] => {
    const row = recordOf(value);
    const label = asString(row.label);
    return label ? [{ label, value: asString(row.value), isCategory: row.isSubValue !== true, backgroundColor: index % 2 === 0 ? stripe : null }] : [];
  });
  return readNutritionRows([...heading, ...rows]);
}

/**
 * The text of a text accordion: one text or a list of paragraphs. Content of another type keeps its
 * texts too, in order, so a section of a type this reader doesn't know still shows what it says.
 */
function accordionText(content: RawRecord): string {
  if (typeof content.text === "string") return content.text;
  if (Array.isArray(content.text)) return content.text.flatMap((text) => asString(text) ?? []).join("\n");
  return collectTexts(content).join("\n");
}

/** Every non-blank string in a value, depth first, leaving out `type` fields. */
function collectTexts(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectTexts);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, item]) => (key === "type" ? [] : collectTexts(item)));
}

/** The nutrition table as the text of an info section: the heading, then each label and value on its own line. */
function nutritionText(rows: NutritionRow[]): string {
  return rows.flatMap((row) => (row.value === null ? [row.label] : [row.label, row.value])).join("\n");
}

/**
 * The product's promotion, from the add-to-cart action: the app sends the promotion along as a
 * `PROMOTION` enrichment (`{ promotion_id, promotion_label }`).
 */
function readRscPromotion(vm: RawRecord): ProductPromotion | null {
  for (const slot of Object.values(recordOf(recordOf(vm.sellableInteraction).slots))) {
    for (const action of asArray(recordOf(slot).actions)) {
      for (const value of asArray(recordOf(recordOf(action).payload).enrichments)) {
        const enrichment = recordOf(value);
        const payload = recordOf(enrichment.payload);
        const id = asString(payload.promotion_id);
        const label = asString(payload.promotion_label);
        if (enrichment.type === "PROMOTION" && id && label) return { id, label };
      }
    }
  }
  return null;
}

/** Whether a value is a parsed product tile; the RSC content parser turns sellable tiles into these. */
function isProductTile(value: unknown): value is ProductTile {
  const tile = recordOf(value);
  return typeof tile.id === "string" && typeof tile.name === "string" && typeof tile.displayPrice === "number";
}

/**
 * A similar product from a product tile. Tiles have the brand apart; the name gets it in front, as
 * the Fusion page has it. The unit quantity is the tile's quantity without its notes.
 */
function toSimilarProduct(tile: ProductTile): SimilarProduct {
  return {
    id: tile.id,
    name: [tile.namePrefix, tile.brand, tile.name].filter(Boolean).join(" "),
    imageId: tile.imageId ?? "",
    displayPrice: tile.displayPrice,
    unitQuantity: tileQuantity(tile),
    comparisonPrice: tile.comparisonPrice,
    maxCount: DEFAULT_MAX_COUNT,
    ...(tile.deposit !== undefined && { deposit: tile.deposit }),
    ...(tile.priceRanges && { priceRanges: tile.priceRanges }),
  };
}

/** The id of a product's details page, with the parameters the app sends. */
export function productDetailsPageId(productId: string): string {
  return `product-details-page-root?id=${encodeURIComponent(productId)}&show_category_action=true&show_remove_from_purchases_page_action=true`;
}
