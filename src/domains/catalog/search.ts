import { SearchFilter, ProductTile, SearchProductResults, SearchRecipe, SearchResults } from "./types";

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

export function extractFilters(value: unknown): SearchFilter[] {
  return asArray(value).flatMap((item) => {
    const filter = asRecord(item);
    const facetId = asString(filter.facetId);
    const name = asString(filter.name) ?? asString(filter.header);
    return facetId && name ? [{ facetId, name, imageId: asString(filter.image) }] : [];
  });
}
