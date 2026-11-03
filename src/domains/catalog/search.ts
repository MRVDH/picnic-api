import { cleanMarkdown, findNode, findNodeById, PmlNode, walkNodes } from "../../pages/pml";
import { extractRecipeTiles } from "../recipe/lists";
import { collectFusionProductTiles } from "./tiles";
import { SearchFilter, ProductTile, SearchProductResults, SearchRecipe, SearchResults, SearchSection, SearchSortingOption } from "./types";

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
  return tile.type === "sellable" ? readSellableTile(tile) : null;
}

/**
 * Extracts a product from a sellable tile without checking its `type`, for pages whose tiles have
 * none (the unavailability replacements page). Returns `null` without an id or name.
 * @param {RscRecord} tile The decoded tile.
 */
export function readSellableTile(tile: RscRecord): ProductTile | null {
  const id = asString(tile.id);
  const title = asRecord(tile.title);
  const name = asString(title.title);
  if (!id || !name) return null;

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

// ─── Search results (Fusion) ──────────────────────────────────────────────────

/** The state boundary that holds what the app filters and sorts with: sections, facets, the search. */
const SEARCH_STATE_ID = "searchState";
/** The blocks of a section's products: `<prefix><section name>`, then `__2`, `__3`, ... for the grid. */
const SECTION_WRAPPER_PREFIX = "client-side-filtering-section-wrapper-";
/** The block with a section's header. */
const SECTION_HEADER_PREFIX = "client-side-filtering-section-header-wrapper-";
/** The block with the product group sections; the bought-before row comes before it. */
const VISUAL_SECTIONS_ID = "structured-selling-unit-search-result-visual-sections";
/** The filter buttons in the page header, `<prefix><facet id>`, and the sort button. */
const FILTER_ITEM_PREFIX = "search-header-visual-item-";
const SORTING_ITEM_ID = "search-header-visual-item-sorting";
/** The filter types the filter buttons toggle, per {@link SearchProductResults} list. */
const FILTER_TYPES = { VISUAL_FILTER: "visualFilters", POWER_FILTER: "powerFilters", TEXTUAL_FILTER: "textualFilters" } as const;

/**
 * Extracts the search results from a Fusion search page (`search-page-results`). The page holds
 * one kind of result, per its `searchState.selectedEntityType`: products (`SELLING_UNIT`), or
 * recipes (`RECIPE`) when opened from the cookbook. Products come in the sections of
 * `searchState.sections`, which the app shows when no filter is selected: the products bought
 * before in a row, then a grid per product group. A page without results has no search state and
 * gives `products: null`.
 * @param {unknown} page The Fusion page.
 * @param {string} query The search term as entered.
 */
export function extractFusionSearchResults(page: unknown, query: string): SearchResults {
  const state = asRecord(findNodeById(page, SEARCH_STATE_ID)?.state);
  const analytics = asRecord(asRecord(state.analyticsTemplate).data);
  const isRecipeSearch = state.selectedEntityType === "RECIPE";

  return {
    query,
    correctedQuery: asString(analytics.query_corrected),
    products: state.selectedEntityType === "SELLING_UNIT" ? extractFusionProductResults(page, state) : null,
    recipes: isRecipeSearch
      ? extractRecipeTiles(page).map((recipe) => ({ id: recipe.id, name: recipe.name, subtitle: recipe.subtitle, imageId: recipe.imageId, tags: recipe.tags }))
      : [],
  };
}

function extractFusionProductResults(page: unknown, state: RscRecord): SearchProductResults {
  // The product blocks of each section, by section name, in document order.
  const wrappers = new Map<string, PmlNode[]>();
  walkNodes(page, (node) => {
    if (node.type !== "BLOCK" || typeof node.id !== "string" || !node.id.startsWith(SECTION_WRAPPER_PREFIX)) return;
    const name = node.id.slice(SECTION_WRAPPER_PREFIX.length).replace(/__\d+$/, "");
    wrappers.set(name, [...(wrappers.get(name) ?? []), node]);
  });
  const visualSections = findNodeById(page, VISUAL_SECTIONS_ID);

  const sections = asArray(state.sections).flatMap((value): SearchSection[] => {
    const name = asString(asRecord(value).name);
    const blocks = name ? wrappers.get(name) : undefined;
    if (!name || !blocks) return [];
    const header = findNodeById(page, SECTION_HEADER_PREFIX + name);
    const headerText = findNode(header, (n) => n.type === "RICH_TEXT" && n.textType === "HEADER3" && typeof n.markdown === "string");
    return [
      {
        id: name,
        type: visualSections && findNodeById(visualSections, blocks[0].id as string) ? "VISUAL" : "RFY",
        title: header ? cleanMarkdown((headerText?.markdown as string | undefined) ?? "") || name : null,
        products: collectFusionProductTiles(blocks),
      },
    ];
  });

  const filters: Record<(typeof FILTER_TYPES)[keyof typeof FILTER_TYPES], SearchFilter[]> = { visualFilters: [], powerFilters: [], textualFilters: [] };
  walkNodes(page, (node) => {
    if (node.type !== "PML" || typeof node.id !== "string" || !node.id.startsWith(FILTER_ITEM_PREFIX) || node.id === SORTING_ITEM_ID) return;
    const filter = readFilterItem(node);
    if (filter) filters[filter.list].push(filter.filter);
  });

  const productIdsByFacetId: Record<string, string[]> = {};
  for (const [facetId, ids] of Object.entries(asRecord(state.sellingUnitIdsByFacetIds))) {
    productIdsByFacetId[facetId] = asArray(ids).filter((id): id is string => typeof id === "string");
  }

  return {
    sections,
    ...filters,
    productIdsByFacetId,
    sortingOptions: readSortingOptions(findNodeById(page, SORTING_ITEM_ID), state),
    selectedSorting: asString(state.selectedSorting) ?? "RELEVANCE",
  };
}

/**
 * Reads a filter button: its press toggles the filter with the facet id, the name and the filter
 * type as the first arguments (`toggleFilter(facetId, name, type, ...)`).
 */
function readFilterItem(item: PmlNode): { list: (typeof FILTER_TYPES)[keyof typeof FILTER_TYPES]; filter: SearchFilter } | null {
  const touchable = findNode(item.pml, (n) => n.type === "TOUCHABLE");
  const props = asRecord(asRecord(asRecord(touchable?.onPress).callback).props);
  const facetId = asString(props.v0);
  const name = asString(props.v1);
  const list = FILTER_TYPES[props.v2 as keyof typeof FILTER_TYPES];
  if (!facetId || !name || !list) return null;
  const image = findNode(item.pml, (n) => n.type === "IMAGE" && typeof asRecord(n.source).id === "string");
  return { list, filter: { facetId, name, imageId: image ? (asRecord(image.source).id as string) : null } };
}

/**
 * Reads the sort orders from the sort button, which opens the sort options with their names and
 * titles as deep link parameters (`sorting_options_ids`, `sorting_options_names`). Falls back to
 * the names in the search analytics, without titles.
 */
function readSortingOptions(button: PmlNode | null, state: RscRecord): SearchSortingOption[] {
  const isSortingDeeplink = (value: unknown): value is string => typeof value === "string" && value.includes("sorting_options_ids=");
  const holder = findNode(button, (node) => Object.values(node).some(isSortingDeeplink));
  const deeplink = holder ? Object.values(holder).find(isSortingDeeplink) : undefined;
  if (deeplink) {
    const ids: string[] = [];
    const titles: string[] = [];
    // app.picnic://store/page;id=search-sort-options-root,presentation-mode=...,search_id=...&sorting_options_ids=...
    for (const param of deeplink.slice(deeplink.indexOf(";") + 1).split(/[,&]/)) {
      const [key, value = ""] = param.split("=");
      if (key === "sorting_options_ids") ids.push(decodeURIComponent(value));
      if (key === "sorting_options_names") titles.push(decodeURIComponent(value));
    }
    if (ids.length > 0) return ids.map((name, index) => ({ name, title: titles[index] || name }));
  }
  return asArray(asRecord(asRecord(state.analyticsTemplate).data).initial_sorting_strategies).flatMap((value) => {
    const name = asString(value);
    return name ? [{ name, title: name }] : [];
  });
}
