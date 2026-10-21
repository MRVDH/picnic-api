import type HttpClient from "../../http-client";
import type { BootstrapData } from "../../pages/fusion";
import type { PageClient } from "../../pages/page-client";
import type { Page } from "../../pages/types";
import { DeeplinkResolution, MessageDisplayPosition, MessagesWrapper } from "./types";

export class AppService {
  constructor(
    private http: HttpClient,
    private pages: PageClient,
  ) {}

  /**
   * Returns the bootstrap data; tab bar configuration, third-party SDK configs, and feature flags.
   */
  getBootstrapData(): Promise<BootstrapData> {
    return this.http.sendRequest<null, BootstrapData>("GET", `/bootstrap`);
  }

  /**
   * Returns a page by its page id, in the format Picnic serves it: a Fusion page, or for pages on
   * Picnic's newer page platform an RSC page parsed into its components (see `RscPageContent`).
   * The format depends on the page and the `x-picnic-agent` version, and Picnic is moving more
   * pages to RSC, so check `format`. One request either way.
   *
   * Pages known to be RSC: `category-tree-root`, `subcategory-page?category_id=<id>`,
   * `category-product-overview?category_id=<id>`, `promotion-category-page?category_id=<id>`,
   * `profile-root`, `promo-group-deep-dive?promo_group_id=<id>`,
   * `search-page-results?search_term=<term>`, `search-page-index`, `meals-category-page`,
   * `meals-category-group-page` and `unavailability-replacements-page-root`.
   *
   * Pages known to be Fusion: `home_page_root`, `purchases-page-root`, `meals-page-root`,
   * `slot-selector-root`, `parcels-overview-page-root`, `promo-page-root`,
   * `product-details-page-root?id=<selling_unit_id>`,
   * `selling-group-details-page?selling_group_id=<id>` and
   * `parcel-tracking-page-root?parcel_id=<id>`.
   * @param {string} pageId The page id, optionally with query params, e.g. `home_page_root`.
   */
  getPage(pageId: string): Promise<Page> {
    return this.pages.getPage(pageId);
  }

  /**
   * Resolves a Picnic deeplink URL to its target resource.
   * The app uses this to handle universal links and custom scheme URIs
   * (e.g. URLs like `https://picnic.app/nl/deeplink/...`).
   * @param {string} url The deeplink URL to resolve.
   */
  resolveDeeplink(url: string): Promise<DeeplinkResolution> {
    return this.http.sendRequest<DeeplinkResolution, DeeplinkResolution>("POST", `/deeplink/resolve`, { url }, { includePicnicHeaders: true });
  }

  /**
   * Returns popup messages in the app (e.g. post-delivery satisfaction prompts,
   * message bar notifications, order-confirmation cards).
   * @param {MessageDisplayPosition[]} [displayPositions] Optional filter by display position(s).
   */
  getMessages(displayPositions?: MessageDisplayPosition[]): Promise<MessagesWrapper> {
    const query = displayPositions?.length ? `?${displayPositions.map((p) => `display_position=${encodeURIComponent(p)}`).join("&")}` : "";
    return this.http.sendRequest<any, MessagesWrapper>("GET", `/messages${query}`, null, { includePicnicHeaders: true });
  }
}
