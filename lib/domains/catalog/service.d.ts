import type HttpClient from "../../http-client";
import { ImageSize } from "../../types/common";
import { ProductDetails, SearchSuggestion } from "./types";
import { FusionPage, SellingUnit } from "../../types/fusion";
export declare class CatalogService {
    private http;
    constructor(http: HttpClient);
    /**
     * Searches for Picnic products matching the query.
     * @param {string} query The keywords to search for.
     */
    search(query: string): Promise<SellingUnit[]>;
    /**
     * Returns suggestions for Picnic products matching the query.
     * @param {string} query The keywords for suggestions.
     */
    getSuggestions(query: string): Promise<SearchSuggestion[]>;
    /**
     * Returns the full product details page. The response is not typed as the content is dynamic.
     * @param {string} productId The product ID to fetch the page for.
     */
    getProductDetailsPage(productId: string): Promise<FusionPage>;
    /**
     * Returns structured product details extracted from the product details page.
     * This is a convenience wrapper around {@link getProductDetailsPage} that parses
     * the Fusion page response into a clean {@link ProductDetails} data model.
     *
     * **⚠️ Experimental:** This method parses dynamic Fusion/PML page structures and
     * may break if Picnic changes their page layout. Use {@link getProductDetailsPage}
     * for a stable alternative.
     *
     * @param {string} productId The product ID to fetch details for.
     */
    getProductDetails(productId: string): Promise<ProductDetails>;
    /**
     * Retrieves a product image from the server as an ArrayBuffer.
     * @param {string} imageId The image id to retrieve.
     * @param {ImageSize} size The size of the image to return.
     */
    getImage(imageId: string, size: ImageSize): Promise<string>;
    /**
     * Retrieves a product image from the server as a Data URI.
     * @param {string} imageId The image id to retrieve.
     * @param {ImageSize} size The size of the image to return.
     */
    getImageAsDataUri(imageId: string, size: ImageSize): Promise<string>;
}
//# sourceMappingURL=service.d.ts.map