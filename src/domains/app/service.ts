import type HttpClient from "../../http-client";
import { UnexpectedPageFormatError } from "../../errors/page-format-error";
import type { BootstrapData, FusionPage } from "../../types/fusion";
import type { RscPage } from "../../types/rsc";
import { parseRscPayload } from "./rsc";
import { DeeplinkResolution } from "./types";

export class AppService {
  constructor(private http: HttpClient) {}

  /**
   * Returns the bootstrap data; tab bar configuration, third-party SDK configs, and feature flags.
   */
  getBootstrapData(): Promise<BootstrapData> {
    return this.http.sendRequest<null, BootstrapData>("GET", `/bootstrap`);
  }

  /**
   * Returns a Fusion page by its page ID. The response shape is shared across all page routes.
   *
   * Some pages are served as a React Server Components payload instead, depending on the
   * page and the `agent` version; for those this throws an `UnexpectedPageFormatError` and
   * `getRscPage` should be used. Known RSC pages: `category-tree-root`, `profile-root` and
   * `promo-group-deep-dive?promo_group_id=<id>`.
   *
   * Known page IDs (no params required):
   * - `home_page_root`
   * - `purchases-page-root`
   * - `meals-page-root`
   * - `slot-selector-root`
   * - `parcels-overview-page-root`
   * - `empty-search-page-root`
   *
   * Pages that require query parameters (append after `?`):
   * - `search-page-results?search_term=<term>`
   * - `product-details-page-root?id=<selling_unit_id>`
   * - `L1-category-page-root?category_id=<id>`
   * - `L2-category-page-root?category_id=<id>`
   * - `delivery-receipt-page?delivery_id=<id>`
   * - `parcel-tracking-page-root?parcel_id=<id>`
   */
  async getPage(pageId: string): Promise<FusionPage> {
    const page = await this.http.sendRequest<null, FusionPage | string>("GET", `/pages/${pageId}`, null, true);
    if (typeof page === "string") throw new UnexpectedPageFormatError(pageId, "rsc");
    return page;
  }

  /**
   * Returns a page served as a React Server Components (RSC) payload, split into its rows.
   * The page data is in the props of the React elements (`["$", type, key, props]`) in `rows`.
   *
   * Throws an `UnexpectedPageFormatError` when the page is served as a Fusion page instead;
   * use `getPage` for those. Known RSC pages: `category-tree-root` (search tab shortcuts and
   * categories), `profile-root` and `promo-group-deep-dive?promo_group_id=<id>`.
   * @param {string} pageId The page ID, optionally with query params, e.g. `category-tree-root`.
   */
  async getRscPage(pageId: string): Promise<RscPage> {
    const page = await this.http.sendRequest<null, FusionPage | string>("GET", `/pages/${pageId}`, null, true);
    if (typeof page !== "string") throw new UnexpectedPageFormatError(pageId, "fusion");
    return parseRscPayload(page);
  }

  /**
   * Resolves a Picnic deeplink URL to its target resource.
   * The app uses this to handle universal links and custom scheme URIs
   * (e.g. URLs like `https://picnic.app/nl/deeplink/...`).
   * @param {string} url The deeplink URL to resolve.
   */
  resolveDeeplink(url: string): Promise<DeeplinkResolution> {
    return this.http.sendRequest<DeeplinkResolution, DeeplinkResolution>("POST", `/deeplink/resolve`, { url }, true);
  }
}
