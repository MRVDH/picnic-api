import { JSONPath } from "jsonpath-plus";
import type HttpClient from "../../http-client";
import { ImageSize } from "../../types/common";
import { ProductDetails, SearchSuggestion } from "./types";
import { FusionPage, SellingUnit } from "../../types/fusion";
import { extractProductDetails } from "./helpers";

export class CatalogService {
  constructor(private http: HttpClient) {}

  /**
   * Searches for Picnic products matching the query.
   * @param {string} query The keywords to search for.
   */
  async search(query: string): Promise<SellingUnit[]> {
    const rawResults = await this.http.sendRequest<any, any>("GET", `/pages/search-page-results?search_term=${encodeURIComponent(query)}`, null, true);
    return JSONPath({ path: "$..sellingUnit", json: rawResults });
  }

  /**
   * Returns suggestions for Picnic products matching the query.
   * @param {string} query The keywords for suggestions.
   */
  getSuggestions(query: string): Promise<SearchSuggestion[]> {
    return this.http.sendRequest<any, SearchSuggestion[]>("GET", `/suggest?search_term=${encodeURIComponent(query)}`);
  }

  /**
   * Returns the full product details page. The response is not typed as the content is dynamic.
   * @param {string} productId The product ID to fetch the page for.
   */
  getProductDetailsPage(productId: string): Promise<FusionPage> {
    return this.http.sendRequest<any, FusionPage>(
      "GET",
      `/pages/product-details-page-root?id=${productId}&show_category_action=true&show_remove_from_purchases_page_action=true`,
      null,
      true,
    );
  }

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
  async getProductDetails(productId: string): Promise<ProductDetails> {
    const page = await this.getProductDetailsPage(productId);
    return extractProductDetails(productId, page);
  }

  /**
   * Retrieves a product image from the server as an ArrayBuffer.
   * @param {string} imageId The image id to retrieve.
   * @param {ImageSize} size The size of the image to return.
   */
  getImage(imageId: string, size: ImageSize): Promise<string> {
    const alternateRoute = this.http.url.split("/api/")[0];
    return this.http.sendRequest<any, string>("GET", `${alternateRoute}/static/images/${imageId}/${size}.png`, null, false, true);
  }

  /**
   * Retrieves a product image from the server as a Data URI.
   * @param {string} imageId The image id to retrieve.
   * @param {ImageSize} size The size of the image to return.
   */
  async getImageAsDataUri(imageId: string, size: ImageSize): Promise<string> {
    const arrayBuffer = await this.getImage(imageId, size);
    return "data:image/png;base64," + Buffer.from(arrayBuffer, "binary").toString("base64");
  }
}
