import { ProductDetails } from "./types";
import { FusionPage } from "../../types/fusion";
/** Strip Picnic color markup like `#(#B40117)` from text. */
export declare const stripColorMarkup: (text: string) => string;
/** Strip bold/italic markdown formatting (`**`, `__`) from text. */
export declare const stripMarkdownFormatting: (text: string) => string;
/** Recursively find a node by its `id` field anywhere in the tree. */
export declare const findById: (node: any, id: string) => any;
/** Extract all string markdown values from a node. */
export declare const extractMarkdowns: (node: any) => string[];
/**
 * Extracts structured product details from a Fusion product details page response.
 * @param {string} productId The product ID that was requested.
 * @param {FusionPage} page The raw Fusion page response.
 */
export declare function extractProductDetails(productId: string, page: FusionPage): ProductDetails;
//# sourceMappingURL=helpers.d.ts.map