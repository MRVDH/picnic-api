import type HttpClient from "../../http-client";
import { ImageSize } from "../../types/common";
import { ProductDetails, SearchOptions, SearchResults, SearchSuggestion } from "./types";
import { FusionPage } from "../../types/fusion";
import { extractSearchResults } from "./helpers";
import { extractProductDetails } from "./product-details";
import type { RscPageClient } from "../app/rsc-client";
import { decodeRscValue, findRscElementProps } from "../app/rsc";

/** The search page component that holds the search parameters (search id, session id). */
const SEARCH_PARAMS_MODULE = "search-page-params/search-page-params-provider.tsx";
/** The search page component that loads the results with the `fetchSearchResults` action. */
const SEARCH_RESULTS_MODULE = "search-page-content/results/index.tsx";

export class CatalogService {
  constructor(
    private http: HttpClient,
    private rsc: RscPageClient,
  ) {}

  /**
   * Searches for products and recipes the way the app does: it fetches the search page (an RSC
   * page with the search parameters), then runs the page's `fetchSearchResults` server action,
   * which returns the results.
   * @param {string} query The keywords to search for.
   * @param {SearchOptions} [options] The sort order and the context the search is opened from.
   */
  async getSearchResults(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    const contextParams = options.context === "MEALS" ? "&page_context=MEALS&is_recipe=true" : "";
    const page = await this.rsc.getPage(`search-page-results?search_term=${encodeURIComponent(query)}${contextParams}`);
    const params = findRscElementProps(page, SEARCH_PARAMS_MODULE)[0]?.params as Record<string, unknown> | undefined;
    if (!params) throw new Error("The search page has no search parameters");

    const actionId = await this.rsc.findServerActionId(page, SEARCH_RESULTS_MODULE, "fetchSearchResults");
    if (!actionId) throw new Error("The search page has no fetchSearchResults action");

    // The same argument the app's results component passes (search-page-content/results/index.tsx).
    const results = await this.rsc.runServerAction(
      actionId,
      [
        {
          dayOffset: params.dayOffset,
          entityType: params.requestedEntityType,
          pageNavigationContext: params.pageNavigationContext,
          requestedSorting: options.sorting ?? "RELEVANCE",
          searchId: params.searchId,
          searchQuery: query,
          searchSessionId: params.searchSessionId,
        },
      ],
      page.version,
    );
    const root = decodeRscValue(results, results.rows["0"]);
    if (!Array.isArray(root) || root[0] !== "$") throw new Error("Unexpected fetchSearchResults response");
    return extractSearchResults((root[3] ?? {}) as Record<string, unknown>);
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
   * @throws {ProductNotFoundError} When the product doesn't exist or isn't available at the user's location.
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
