import type HttpClient from "../../http-client";
import { ImageSize } from "../../types/common";
import { CategoryProducts, CategorySection, ProductDetails, SearchOptions, SearchResults, SearchSuggestion, Subcategories } from "./types";
import { FusionPage } from "../../pages/fusion";
import { extractSearchResults } from "./helpers";
import { extractProductDetails, productDetailsPageId } from "./product-details";
import type { PageClient } from "../../pages/page-client";
import { decodeRscValue, findRscElementProps } from "../../pages/rsc";
import { extractCategoryProducts, extractCategoryTree, extractSubcategories } from "./categories";

/** The search page component that holds the search parameters (search id, session id). */
const SEARCH_PARAMS_MODULE = "search-page-params/search-page-params-provider.tsx";
/** The search page component that loads the results with the `fetchSearchResults` action. */
const SEARCH_RESULTS_MODULE = "search-page-content/results/index.tsx";

export class CatalogService {
  constructor(
    private http: HttpClient,
    private pages: PageClient,
  ) {}

  /**
   * Returns the category tree as the app shows it (`category-tree-root`): links to promotions and
   * recipes, then the categories under "Alle categorieën". A link's `target` says which method
   * opens it.
   */
  async getCategories(): Promise<CategorySection[]> {
    return extractCategoryTree(await this.pages.getRscContent("category-tree-root"));
  }

  /**
   * Returns a category's promotions link and subcategories (`subcategory-page`).
   * @param {string} categoryId The category id of a link with target `subcategories`, e.g. "21724".
   */
  async getSubcategories(categoryId: string): Promise<Subcategories> {
    const content = await this.pages.getRscContent(`subcategory-page?category_id=${encodeURIComponent(categoryId)}`);
    return extractSubcategories(categoryId, content);
  }

  /**
   * Returns the products of a subcategory in sections, with the filters (`category-product-overview`).
   * @param {string} categoryId The category id of a link with target `products`, e.g. "21746".
   */
  async getCategoryProducts(categoryId: string): Promise<CategoryProducts> {
    const content = await this.pages.getRscContent(`category-product-overview?category_id=${encodeURIComponent(categoryId)}`);
    return extractCategoryProducts(categoryId, content);
  }

  /**
   * Returns the products on promotion in a category, in sections per promotion (`promotion-category-page`).
   * @param {string} categoryId The category id of a link with target `promotions`, e.g. "21724".
   */
  async getCategoryPromotions(categoryId: string): Promise<CategoryProducts> {
    const content = await this.pages.getRscContent(`promotion-category-page?category_id=${encodeURIComponent(categoryId)}`);
    return extractCategoryProducts(categoryId, content);
  }

  /**
   * Searches for products and recipes the way the app does: it fetches the search page (an RSC
   * page with the search parameters), then runs the page's `fetchSearchResults` server action,
   * which returns the results.
   * @param {string} query The keywords to search for.
   * @param {SearchOptions} [options] The sort order and the context the search is opened from.
   */
  async getSearchResults(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    const contextParams = options.context === "MEALS" ? "&page_context=MEALS&is_recipe=true" : "";
    const page = await this.pages.getRscPayload(`search-page-results?search_term=${encodeURIComponent(query)}${contextParams}`);
    const params = findRscElementProps(page, SEARCH_PARAMS_MODULE)[0]?.params as Record<string, unknown> | undefined;
    if (!params) throw new Error("The search page has no search parameters");

    const actionId = await this.pages.findServerActionId(page, SEARCH_RESULTS_MODULE, "fetchSearchResults");
    if (!actionId) throw new Error("The search page has no fetchSearchResults action");

    // The same argument the app's results component passes (search-page-content/results/index.tsx).
    const results = await this.pages.runServerAction(
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

  /** Fetches the product details page (Fusion). */
  private getProductDetailsPage(productId: string): Promise<FusionPage> {
    return this.pages.getFusionPage(productDetailsPageId(productId));
  }

  /**
   * Returns a product as the app's product page shows it (`product-details-page-root`): name,
   * prices, promotions, images, the information sections, nutrition, allergens and the bundles.
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
