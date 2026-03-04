export type SearchSuggestion = {
    type: "SEARCH_SUGGESTION";
    id: string;
    suggestion: string;
};
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
/** A bundle option shown on the product details page (buy-more-pay-less). */
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
/** Structured product details extracted from the Fusion product details page. */
export type ProductDetails = {
    /** The selling unit ID (e.g. "s1001524"). */
    id: string;
    /** The product name (e.g. "Blond"). */
    name: string;
    /** The brand name (e.g. "Affligem"). */
    brand: string;
    /** The unit quantity description (e.g. "6 x 300 ml"). */
    unitQuantity: string;
    /** The unit price description (e.g. "€4.81/l"). `null` if not available. */
    unitPrice: string | null;
    /** The display price in cents (e.g. 865 for €8.65). */
    displayPrice: number;
    /** Maximum number of items that can be added to the cart. */
    maxCount: number;
    /** Image IDs for the product gallery. */
    imageIds: string[];
    /** Product description text (may contain markdown). `null` if not available. */
    description: string | null;
    /** Short product highlights (e.g. ["Goudblond abdijbier", "Met hints van tropisch fruit"]). */
    highlights: string[];
    /** Known allergens (e.g. ["Gluten"]). */
    allergens: string[];
    /** Collapsible info sections (Ingredients, Nutritional Values, Extra Information, etc.). */
    infoSections: ProductInfoSection[];
    /** Active promotion on this product, if any. */
    promotion: ProductPromotion | null;
    /** Bundle options (buy-more-pay-less). Empty when no bundles are available. */
    bundles: BundleItem[];
    /** Selling units for similar/alternative products. */
    similarProducts: SimilarProduct[];
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
};
//# sourceMappingURL=types.d.ts.map