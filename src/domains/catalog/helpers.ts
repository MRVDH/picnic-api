import { JSONPath } from "jsonpath-plus";
import { BundleItem, ProductDetails, ProductPromotion, SearchFilter, ProductTile, SearchProductResults, SearchRecipe, SearchResults, SimilarProduct } from "./types";
import { FusionPage } from "../../types/fusion";

/** Strip Picnic color markup like `#(#B40117)` from text. */
export const stripColorMarkup = (text: string): string => text.replace(/#\([A-Za-z0-9#_]+\)/g, "").trim();

/** Strip bold/italic markdown formatting (`**`, `__`) from text. */
export const stripMarkdownFormatting = (text: string): string => text.replace(/\*\*/g, "").replace(/__/g, "");

/** Recursively find a node by its `id` field anywhere in the tree. */
export const findById = (node: any, id: string): any => {
  if (!node) return null;
  if (node.id === id) return node;
  for (const key of ["child", "children"]) {
    if (Array.isArray(node[key])) {
      for (const child of node[key]) {
        const result = findById(child, id);
        if (result) return result;
      }
    } else if (node[key] && typeof node[key] === "object") {
      const result = findById(node[key], id);
      if (result) return result;
    }
  }
  return null;
};

/** Extract all string markdown values from a node. */
export const extractMarkdowns = (node: any): string[] => {
  if (!node) return [];
  return JSONPath({ path: "$..markdown", json: node }).filter((m: any) => typeof m === "string");
};

/**
 * Extracts structured product details from a Fusion product details page response.
 * @param {string} productId The product ID that was requested.
 * @param {FusionPage} page The raw Fusion page response.
 */
export function extractProductDetails(productId: string, page: FusionPage): ProductDetails {
  // ── Name, brand, unit quantity, unit price ──
  const mainContainer = findById(page.layout.body, "product-details-page-root-main-container");

  const children = JSONPath({ path: "$.pml.component.children", json: mainContainer })[0] ?? [];
  const nameNode = children.find((child: any) => child.textType === "HEADER1");
  const brandNode = children.find((child: any) => child.textAttributes?.weight === "REGULAR");
  const stackNode = children.find((child: any) => child.type === "STACK");
  const [unitQuantityNode, unitPriceNode] = stackNode?.children?.filter((child: any) => child.type === "RICH_TEXT") ?? [];

  const nodeMarkdown = (node: any) => typeof node?.markdown === "string" ? stripColorMarkup(node.markdown) : null;

  const name = nodeMarkdown(nameNode) ?? "";
  const brand = nodeMarkdown(brandNode);
  const unitQuantity = nodeMarkdown(unitQuantityNode) ?? "";
  const unitPrice = nodeMarkdown(unitPriceNode);

  // ── Price & max count ──
  const allSellingUnits: any[] = JSONPath({ path: "$..sellingUnit", json: page });
  const mainUnit = allSellingUnits.find((u: any) => u.id === productId && u.max_count !== undefined) ?? {};

  // For bundle products the selling unit carries `display_price`. For non-bundle
  // products the price is rendered as a PRICE component inside the main container.
  let displayPrice: number = mainUnit.display_price ?? 0;
  // price_ranges may be on the selling unit directly (rare on PDP), or embedded
  // in the PML script expression params (at __ep1.v1 / __ep2.v1 paths used by
  // getCurrentPrice / getFormattedPriceValueForPriceRanges expressions).
  let priceRanges = mainUnit.price_ranges ?? null;
  if (!priceRanges) {
    priceRanges = extractPriceRangesFromExpressions(page) ?? null;
  }
  if (!displayPrice) {
    const bundleNode = findById(  page.layout.body, productId);
    if (bundleNode) {
      displayPrice = JSONPath({ path: "$..price", json: bundleNode })[0] ?? 0;
    }
  }
  if (!displayPrice && mainContainer) {
    const priceComponents: number[] = JSONPath({ path: "$..price", json: mainContainer })
      .filter((p: any) => typeof p === "number");
    displayPrice = priceComponents[0] ?? 0;
  }
  const maxCount: number = mainUnit.max_count ?? 0;

  // ── Gallery images ──
  const gallery = findById(  page.layout.body, "product-page-image-gallery-main-image-container");
  const imageIds: string[] = gallery
    ? [...new Set<string>(JSONPath({ path: "$..source.id", json: gallery }))]
    : mainUnit.image_id ? [mainUnit.image_id] : [];

  // ── Description ──
  const descBlock = findById(  page.layout.body, "description");
  const descMarkdowns = extractMarkdowns(descBlock);
  const description = descMarkdowns.length > 0 ? descMarkdowns.join("\n") : null;

  // ── Highlights ──
  const highlightsBlock = findById(  page.layout.body, "product-page-highlights");
  const highlights = extractMarkdowns(highlightsBlock).map((h) => stripMarkdownFormatting(stripColorMarkup(h)));

  // ── Allergens ──
  const allergiesBlock = findById(  page.layout.body, "product-page-allergies");
  const allergenTexts = extractMarkdowns(allergiesBlock).map(stripColorMarkup);
  // Allergen list starts with a heading like "Bevat" and may include a separator
  // like "Bevat mogelijk" partway through. Drop the heading(s) and keep individual allergens.
  const allergens = allergenTexts.filter(
    (t) => !/^bevat(\s+mogelijk)?$/i.test(t.trim()),
  );

  // ── Info sections (accordion) ──
  const accordionBlock = findById(  page.layout.body, "accordion-list");
  const infoSections: ProductDetails["infoSections"] = [];
  if (accordionBlock) {
    const items = JSONPath({ path: "$..items", json: accordionBlock })[0];
    if (Array.isArray(items)) {
      for (const item of items) {
        const headerTexts = extractMarkdowns(item.header).map(stripMarkdownFormatting).map(stripColorMarkup);
        const bodyTexts = extractMarkdowns(item.body).map(stripColorMarkup);
        infoSections.push({
          title: headerTexts[0] ?? "",
          content: bodyTexts.join("\n"),
        });
      }
    }
  }

  // ── Promotion ──
  let promotion: ProductPromotion | null = null;
  const promoData: any[] = JSONPath({ path: "$..promotion_id", json: page });
  const promoLabels: any[] = JSONPath({ path: "$..promotion_label", json: page });
  if (promoData.length > 0 && promoLabels.length > 0) {
    promotion = {
      id: promoData[0],
      label: promoLabels[0],
    };
  }

  // ── Bundles ──
  const bundles: BundleItem[] = [];
  const bundleContainer = findBundleContainer(  page.layout.body);

  if (bundleContainer) {
    // Each bundle item is wrapped in a STATE_BOUNDARY with id matching the selling unit id
    const bundleItemNodes: any[] = [];
    const walkBundleItems = (node: any) => {
      if (!node) return;
      if (typeof node === "object" && !Array.isArray(node)) {
        if (node.type === "STATE_BOUNDARY" && typeof node.id === "string" && node.id.startsWith("s")) {
          bundleItemNodes.push(node);
        }
        for (const v of Object.values(node)) walkBundleItems(v);
      } else if (Array.isArray(node)) {
        for (const item of node) walkBundleItems(item);
      }
    };
    walkBundleItems(bundleContainer);

    for (let i = 0; i < bundleItemNodes.length; i++) {
      const bNode = bundleItemNodes[i];
      const sellingUnits: any[] = JSONPath({ path: "$..sellingUnit", json: bNode });
      const prices: number[] = JSONPath({ path: "$..price", json: bNode }).filter((p: any) => typeof p === "number");
      const su = sellingUnits[0];
      if (su) {
        bundles.push({
          id: su.id,
          quantity: i + 1,
          pricePerUnit: prices[0] ?? 0,
          imageId: su.image_id ?? "",
          maxCount: su.max_count ?? 0,
        });
      }
    }
  }

  // ── Similar products ──
  const altContainer = findById(  page.layout.body, "alternatives-container");
  const altSellingUnits: any[] = altContainer ? JSONPath({ path: "$..sellingUnit", json: altContainer }) : [];
  const similarProducts: SimilarProduct[] = altSellingUnits
    .filter((u: any) => u.display_price !== undefined)
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      imageId: u.image_id,
      displayPrice: u.display_price,
      unitQuantity: u.unit_quantity,
      maxCount: u.max_count,
      ...(u.deposit !== undefined ? { deposit: u.deposit } : {}),
      ...(u.price_ranges ? { priceRanges: u.price_ranges } : {}),
    }));

  return {
    id: productId,
    name,
    brand,
    unitQuantity,
    unitPrice,
    displayPrice,
    maxCount,
    imageIds,
    description,
    highlights,
    allergens,
    infoSections,
    promotion,
    bundles,
    priceRanges,
    similarProducts,
  };
}

/** Walk the Fusion tree to find the `product-page-bundles-*` container node. */
function findBundleContainer(body: any): any {
  const walk = (n: any): any => {
    if (!n) return null;
    if (typeof n === "object" && !Array.isArray(n)) {
      if (typeof n.id === "string" && n.id.startsWith("product-page-bundles-")) return n;
      for (const v of Object.values(n)) {
        const result = walk(v);
        if (result) return result;
      }
    } else if (Array.isArray(n)) {
      for (const item of n) {
        const result = walk(item);
        if (result) return result;
      }
    }
    return null;
  };
  return walk(body);
}

/**
 * Extract price_ranges from PML script expression parameters.
 * On the PDP, price ranges are embedded in the expression payload (e.g. __ep1.v1)
 * used by scripts like `getCurrentPrice` / `getFormattedPriceValueForPriceRanges`.
 * Each entry has `{ price: number, from_quantity: number }`.
 */
function extractPriceRangesFromExpressions(page: FusionPage): any[] | null {
  // Search the entire page tree for expression params containing price_range-shaped arrays
  const allV1Arrays: any[] = JSONPath({ path: "$..__ep1.v1", json: page });
  for (const arr of allV1Arrays) {
    if (
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr[0].price !== undefined &&
      arr[0].from_quantity !== undefined
    ) {
      return arr;
    }
  }
  // Also check __ep2.v1 as a fallback
  const allV1Ep2: any[] = JSONPath({ path: "$..__ep2.v1", json: page });
  for (const arr of allV1Ep2) {
    if (
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr[0].price !== undefined &&
      arr[0].from_quantity !== undefined
    ) {
      return arr;
    }
  }
  return null;
}

// ─── Search results (RSC) ─────────────────────────────────────────────────────

type RscRecord = Record<string, unknown>;

const LABEL_POSITIONS = ["topLeft", "topRight", "middleLeft", "bottomLeft"];

const asRecord = (value: unknown): RscRecord => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RscRecord) : {});
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === "number" ? value : null);
/** Tile prices are in euros (1.89); the rest of the library uses cents. */
const toCents = (value: unknown): number | null => (typeof value === "number" ? Math.round(value * 100) : null);

/**
 * Extracts the search results from the decoded props of the `fetchSearchResults` server action's
 * root element (`{ searchQuery, storeSelector, storeResults }`). `storeResults.SUPERMARKET` holds
 * the products, `storeResults.MEALS` the recipes.
 * @param {RscRecord} props The decoded props of the action's root element.
 */
export function extractSearchResults(props: RscRecord): SearchResults {
  const stores = asRecord(props.storeResults);
  const supermarket = stores.SUPERMARKET ? asRecord(stores.SUPERMARKET) : null;
  const meals = asRecord(stores.MEALS);

  return {
    query: asString(props.searchQuery) ?? "",
    correctedQuery: asString(supermarket?.correctedSearchTerm) ?? asString(meals.correctedSearchTerm),
    products: supermarket ? extractProductResults(supermarket) : null,
    recipes: asArray(meals.sections).flatMap((section) => asArray(asRecord(section).items)).flatMap((item) => {
      const recipe = extractSearchRecipe(asRecord(item));
      return recipe ? [recipe] : [];
    }),
  };
}

function extractProductResults(store: RscRecord): SearchProductResults {
  const productIdsByFacetId: Record<string, string[]> = {};
  for (const [facetId, ids] of Object.entries(asRecord(store.entityIdsByFacetId))) {
    productIdsByFacetId[facetId] = asArray(ids).filter((id): id is string => typeof id === "string");
  }

  return {
    sections: asArray(store.sections).map((value) => {
      const section = asRecord(value);
      return {
        id: asString(section.id) ?? "",
        type: asString(section.type) ?? "",
        title: section.shouldShowHeader ? asString(section.headerName) : null,
        products: asArray(section.items).flatMap((item) => {
          const product = extractProductTile(asRecord(item));
          return product ? [product] : [];
        }),
      };
    }),
    visualFilters: extractFilters(store.visualFilters),
    powerFilters: extractFilters(store.powerFilters),
    textualFilters: extractFilters(store.textualFilters),
    productIdsByFacetId,
    sortingOptions: asArray(store.sortingOptions).flatMap((value) => {
      const option = asRecord(value);
      const name = asString(option.name);
      return name ? [{ name, title: asString(option.localizedTitle) ?? name }] : [];
    }),
    selectedSorting: asString(store.selectedSorting) ?? "RELEVANCE",
  };
}

/**
 * Extracts a product from a sellable tile (`type: "sellable"`) of an RSC page or server action,
 * e.g. in search results or a promotion page. Returns `null` for other tiles.
 * @param {RscRecord} tile The decoded tile.
 */
export function extractProductTile(tile: RscRecord): ProductTile | null {
  const id = asString(tile.id);
  const title = asRecord(tile.title);
  const name = asString(title.title);
  if (tile.type !== "sellable" || !id || !name) return null;

  const images = asRecord(tile.images);
  const price = asRecord(tile.price);
  const priceRanges = asArray(price.priceRanges).flatMap((value) => {
    const range = asRecord(value);
    const rangePrice = asNumber(range.price);
    const fromQuantity = asNumber(range.fromQuantity);
    return rangePrice !== null && fromQuantity !== null ? [{ price: rangePrice, from_quantity: fromQuantity }] : [];
  });
  const labels = asRecord(tile.labels);

  return {
    id,
    name,
    namePrefix: asString(title.prefix)?.trim() || null,
    brand: asString(asRecord(tile.subtitle).text),
    qualityCue: asString(asRecord(tile.qualityCue).text),
    imageId: asString(asRecord(images.primaryImage).imageId) ?? asString(asRecord(images.sellingUnitImage).imageId),
    // The tile's own price; the lowest-quantity price tier when it has none.
    displayPrice: toCents(price.priceValue) ?? [...priceRanges].sort((x, y) => x.from_quantity - y.from_quantity)[0]?.price ?? 0,
    originalPrice: toCents(price.referencePriceValue),
    unitPrice: asString(price.unitPrice),
    priceRanges: priceRanges.length > 0 ? priceRanges : null,
    unitQuantity: asArray(tile.suffixes)
      .map(asRecord)
      .filter((suffix) => suffix.type === "TEXT")
      .flatMap((suffix) => asString(suffix.text) ?? [])
      .join(", "),
    labels: LABEL_POSITIONS.flatMap((position) =>
      asArray(labels[position]).map((value) => {
        const label = asRecord(value);
        return { position, type: asString(label.type), text: asString(label.labelText) };
      }),
    ),
    isUnavailable: tile.unavailability !== null && tile.unavailability !== undefined,
    numberOfOrders: asNumber(tile.numberOfOrders),
  };
}

function extractSearchRecipe(tile: RscRecord): SearchRecipe | null {
  const id = asString(tile.id);
  const text = asRecord(tile.text);
  const name = asString(asRecord(text.title).text);
  if (!id || !name) return null;

  return {
    id,
    name,
    subtitle: asString(asRecord(text.subtitle).text),
    imageId: asString(asRecord(tile.image).imageId),
    tags: asArray(text.tags).flatMap((tag) => asString(asRecord(tag).text) ?? []),
  };
}

function extractFilters(value: unknown): SearchFilter[] {
  return asArray(value).flatMap((item) => {
    const filter = asRecord(item);
    const facetId = asString(filter.facetId);
    const name = asString(filter.name) ?? asString(filter.header);
    return facetId && name ? [{ facetId, name, imageId: asString(filter.image) }] : [];
  });
}
