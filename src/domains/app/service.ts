import type HttpClient from "../../http-client";
import { UnexpectedPageFormatError } from "../../errors/page-format-error";
import type { BootstrapData, FusionPage } from "../../types/fusion";
import { parseRscPageContent } from "./rsc";
import type { RscPageClient } from "./rsc-client";
import { DeeplinkResolution, RscPageContent } from "./types";

export class AppService {
  constructor(
    private http: HttpClient,
    private rsc: RscPageClient,
  ) {}

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
   * `getRscPageContent` should be used. Known RSC pages: `category-tree-root`,
   * `subcategory-page?category_id=<id>`, `category-product-overview?category_id=<id>`,
   * `promotion-category-page?category_id=<id>`, `profile-root`,
   * `promo-group-deep-dive?promo_group_id=<id>`, `search-page-results?search_term=<term>`,
   * `search-page-index`, `meals-category-page`, `meals-category-group-page` and
   * `unavailability-replacements-page-root`.
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
   * Returns the content of a page served as RSC as a tree of its components (see
   * `RscPageContent`): props with references resolved, nested components as children, the
   * theme colors as tokens and product tiles parsed. Throws an `UnexpectedPageFormatError` when
   * the page is served as a Fusion page; use `getPage` for those. Known RSC pages are listed at
   * {@link getPage}.
   * @param {string} pageId The page ID, optionally with query params, e.g. `profile-root`.
   */
  async getRscPageContent(pageId: string): Promise<RscPageContent> {
    return parseRscPageContent(pageId, await this.rsc.getPage(pageId));
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
