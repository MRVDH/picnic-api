import { PriceRange } from "../../pages/fusion";

// ─── Search ───────────────────────────────────────────────────────────────────

export type SearchSuggestion = {
  type: "SEARCH_SUGGESTION";
  id: string;
  suggestion: string;
};

/** Options for {@link CatalogService.getSearchResults}. */
export type SearchOptions = {
  /** A sorting option `name` from {@link SearchProductResults.sortingOptions}. Default: `"RELEVANCE"`. */
  sorting?: string;
  /**
   * Where the search is opened from. `"MEALS"` is the cookbook's recipe search; it sends the page
   * parameters the app's cookbook search link uses (`page_context=MEALS&is_recipe=true`).
   * Default: the product search.
   */
  context?: "MEALS";
};

/** The results of a search, as the app's search page shows them: products and recipes. */
export type SearchResults = {
  /** The search term as entered. */
  query: string;
  /** The term Picnic searched for instead (spelling correction), or `null`. */
  correctedQuery: string | null;
  /** Product results. `null` when the response has no product results. */
  products: SearchProductResults | null;
  /** Recipe results. */
  recipes: SearchRecipe[];
};

/** Product results of a search. */
export type SearchProductResults = {
  /**
   * The result sections in display order, e.g. "Opnieuw bestellen" (products bought before)
   * followed by one section per product group ("Halfvol", "Houdbaar"). A product can appear in
   * more than one section.
   */
  sections: SearchSection[];
  /** Filters shown as image tiles, e.g. "Halfvol". */
  visualFilters: SearchFilter[];
  /** Filters shown as toggles with an icon, e.g. "Bio". */
  powerFilters: SearchFilter[];
  /** Filters shown as text chips, e.g. "Acties". */
  textualFilters: SearchFilter[];
  /** Product ids per filter `facetId`, to apply a filter to the results. */
  productIdsByFacetId: Record<string, string[]>;
  /** The available sort orders. */
  sortingOptions: SearchSortingOption[];
  /** The `name` of the sort order the results are in. */
  selectedSorting: string;
};

/** A section of product results. */
export type SearchSection = {
  /** The section id, e.g. "Opnieuw bestellen". */
  id: string;
  /** The section type, e.g. "RFY" (bought before) or "VISUAL" (a product group). */
  type: string;
  /** The header shown above the section, or `null` when the app shows none. */
  title: string | null;
  /** The products in the section, in display order. */
  products: ProductTile[];
};

/** A product tile, as shown in search results and on promotion pages. */
export type ProductTile = {
  /** The selling unit id, e.g. "s1004201". */
  id: string;
  /** The product name, e.g. "Halfvolle melk". */
  name: string;
  /** Text shown before the name, or `null`. */
  namePrefix: string | null;
  /** The line below the name, usually the brand, e.g. "Campina". */
  brand: string | null;
  /** The line above the name, e.g. "Op basis van doperwten", or `null`. */
  qualityCue: string | null;
  /** The main product image id. */
  imageId: string | null;
  /** The price in cents for one unit. */
  displayPrice: number;
  /** The original price in cents when the product is discounted, otherwise `null`. */
  originalPrice: number | null;
  /** The unit price text, e.g. "€1,26/l", or `null`. */
  unitPrice: string | null;
  /** Bundle price tiers, or `null` when the price doesn't depend on the quantity. */
  priceRanges: PriceRange[] | null;
  /** The quantity texts, e.g. "1.5 liter", joined with ", ". */
  unitQuantity: string;
  /** Labels on the tile, e.g. a promotion ("1+1 gratis"). */
  labels: ProductTileLabel[];
  /** Whether the product can't be ordered at the moment. */
  isUnavailable: boolean;
  /** How often the customer ordered the product, when known. */
  numberOfOrders: number | null;
};

/** A label on a product tile. */
export type ProductTileLabel = {
  /** Where the label sits on the tile: "topLeft", "topRight", "middleLeft" or "bottomLeft". */
  position: string;
  /** The label type, e.g. "PROMO". */
  type: string | null;
  /** The label text, e.g. "1+1 gratis". */
  text: string | null;
};

/** A recipe in search results. */
export type SearchRecipe = {
  /** The recipe (selling group) id. */
  id: string;
  /** The recipe name, e.g. "Warme chocolademelk". */
  name: string;
  /** The line below the name, e.g. "met kruidnootjes", or `null`. */
  subtitle: string | null;
  /** The image id, e.g. "recipes/a8de51fc...". */
  imageId: string | null;
  /** Tags shown on the tile, e.g. ["15 min"]. */
  tags: string[];
};

/** A filter for search results. */
export type SearchFilter = {
  /** The facet the filter selects, e.g. "category_level_3.22142"; a key of `productIdsByFacetId`. */
  facetId: string;
  /** The filter name, e.g. "Halfvol". */
  name: string;
  /** The image id shown with the filter, or `null`. */
  imageId: string | null;
};

/** A sort order for search results. */
export type SearchSortingOption = {
  /** The value to pass as `SearchOptions.sorting`, e.g. "RELEVANCE". */
  name: string;
  /** The title the app shows, e.g. "Relevant voor jou". */
  title: string;
};

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * What a category link opens: the subcategories of a category ({@link CatalogService.getSubcategories}),
 * the products of a subcategory ({@link CatalogService.getCategoryProducts}), the promotions of a
 * category ({@link CatalogService.getCategoryPromotions}), or another page (follow `deeplink`).
 */
export type CategoryLinkTarget =
  | { type: "subcategories"; categoryId: string }
  | { type: "products"; categoryId: string }
  | { type: "promotions"; categoryId: string }
  | { type: "page" };

/** An entry of a category list, e.g. "Fruit" or "Alle acties". */
export type CategoryLink = {
  name: string;
  imageId: string | null;
  /** A label next to the name, e.g. "1200+ producten", or null. */
  label: string | null;
  /** The deep link the app opens. */
  deeplink: string;
  target: CategoryLinkTarget;
};

/** A part of the category tree, under a heading such as "Alle categorieën", or without one. */
export type CategorySection = {
  title: string | null;
  links: CategoryLink[];
};

/** The subcategories of a category (`subcategory-page`), e.g. "Fruit": its promotions and subcategories. */
export type Subcategories = {
  categoryId: string;
  title: string;
  links: CategoryLink[];
};

/** The products of a subcategory (`category-product-overview`) or the promotions of a category. */
export type CategoryProducts = {
  categoryId: string;
  title: string;
  /** The products in sections, with the filters; the same model as the search results. */
  results: SearchProductResults;
};

// ─── Product Details ──────────────────────────────────────────────────────────

/** A collapsible info section from the product details page (e.g. Ingredients, Nutritional Values). */
export type ProductInfoSection = {
  /** Section title (e.g. "Ingrediënten", "Voedingswaarde", "Extra informatie"). */
  title: string;
  /** Section body content as raw markdown text. */
  content: string;
};

/** Promotion / discount label attached to a product (e.g. "1+1 gratis"). */
export type ProductPromotion = {
  /** Unique promotion identifier. */
  id: string;
  /** Human-readable promotion label (e.g. "1+1 gratis"). */
  label: string;
};

/** A colored badge on the product details page, such as a label ("Biologisch") or an allergen. */
export type ProductBadge = {
  /** The badge text. */
  text: string;
  /** Text color, e.g. "#4B8505". */
  textColor: string;
  /** Background color, e.g. "#ffffff". */
  backgroundColor: string;
};

/** A highlight line, e.g. "**Romig** van smaak" with a stars icon. */
export type ProductHighlight = {
  /** The text; may contain markdown and color tags. */
  text: string;
  /** The app's icon key, e.g. "starsOutlined", or `null`. */
  iconKey: string | null;
  /** The deeplink the highlight opens, or `null`. */
  linkTarget: string | null;
};

/** The allergens of a product, split as the app shows them. */
export type ProductAllergens = {
  /** Allergens under "Bevat" ("Enthält", "Contient"). */
  contains: ProductBadge[];
  /** Allergens under "Bevat mogelijk" ("Kann enthalten", "Peut contenir"). */
  mayContain: ProductBadge[];
};

/** A row of a nutrition table. */
export type NutritionRow = {
  /** The nutrient or heading, e.g. "Energie", "waarvan suikers", "Per 100 g". */
  label: string;
  /** The value, e.g. "206 kJ /", or `null` for a heading row. */
  value: string | null;
  /** Whether the row is a main nutrient rather than a sub-row ("waarvan ..."). */
  isCategory: boolean;
  /** The row's background color (the app stripes rows), or `null`. */
  backgroundColor: string | null;
};

/** A colored tag next to the unit quantity, e.g. "Diepvries". */
export type ProductTag = {
  text: string;
  /** The text color, or `null` when it's the regular text color. */
  color: string | null;
};

/** Structured product details extracted from the Fusion product details page. */
export type Product = {
  /** The selling unit ID (e.g. "s1001524"). */
  id: string;
  /** The product name (e.g. "Blond"). */
  name: string;
  /** The brand name (e.g. "Affligem"), or `null`. */
  brand: string | null;
  /** The unit quantity description (e.g. "6 x 300 ml"). */
  unitQuantity: string;
  /**
   * The unit price description (e.g. "€4.81/l"), or `null` when the page has none. For products
   * with `priceRanges` it is the unit price of the first tier, which the app shows while the
   * product isn't in the cart.
   */
  unitPrice: string | null;
  /** Badges shown before the unit quantity, e.g. a size badge "XL". */
  quantityBadges: ProductBadge[];
  /** Tags shown after the unit price, e.g. "Diepvries". */
  tags: ProductTag[];
  /** The price in cents for one unit. */
  displayPrice: number;
  /** The original price in cents when the product is discounted, otherwise `null`. */
  originalPrice: number | null;
  /** The color the app shows the price in (e.g. red for a discount), or `null` for the regular color. */
  displayPriceColor: string | null;
  /** The product's own price tiers (price per unit from a quantity), or `null` without tiers. */
  priceRanges: PriceRange[] | null;
  /** Maximum number of items that can be added to the cart. */
  maxCount: number;
  /** Image IDs for the product gallery. */
  imageIds: string[];
  /** Label badges, e.g. "Biologisch". Can include the promotion label. */
  labels: ProductBadge[];
  /** Product description text (may contain markdown). `null` if not available. */
  description: string | null;
  /** Highlight lines with their icons. */
  highlightItems: ProductHighlight[];
  /** @deprecated use `highlightItems`. The highlight texts without markdown. */
  highlights: string[];
  /** Allergens, split into "contains" and "may contain" as the app shows them. */
  allergenGroups: ProductAllergens;
  /** @deprecated use `allergenGroups`. The names of all allergens, both groups. */
  allergens: string[];
  /** Collapsible info sections (Ingredients, Nutritional Values, Extra Information, etc.). */
  infoSections: ProductInfoSection[];
  /** The nutrition table from the "Voedingswaarde" (or "Nährwerte") section, or empty. */
  nutritionRows: NutritionRow[];
  /** Active promotion on this product, if any. */
  promotion: ProductPromotion | null;
  /** @deprecated use `priceRanges`. Always empty: product pages don't show separate bundle products. */
  bundles: BundleItem[];
  /** Similar/alternative products. */
  similarProducts: SimilarProduct[];
};

/** @deprecated use `Product.priceRanges`. Product pages don't show separate bundle products. */
export type BundleItem = {
  /** The selling unit ID for this bundle option. */
  id: string;
  /** Number of items in this bundle (1, 2, 3, …). */
  quantity: number;
  /** Price per unit in cents for this bundle option. */
  pricePerUnit: number;
  /** Product image ID for this bundle option. */
  imageId: string;
  /** Maximum number of items that can be added to the cart. */
  maxCount: number;
};

/** A similar/alternative product shown on the product details page. */
export type SimilarProduct = {
  /** The selling unit ID. */
  id: string;
  /** The product name. */
  name: string;
  /** The product image ID. */
  imageId: string;
  /** The display price in cents. */
  displayPrice: number;
  /** The unit quantity description (e.g. "6 x 300 ml • 6.6%"). */
  unitQuantity: string;
  /** Maximum number of items that can be added to the cart. */
  maxCount: number;
  /** Deposit amount in cents, if applicable. */
  deposit?: number;
  /** Progressive discount price tiers. `null` or absent when no bundle pricing is available. */
  priceRanges?: PriceRange[] | null;
};
