import type HttpClient from "../../http-client";
import type { BootstrapData, FusionPage } from "../../types/fusion";
import { DeeplinkResolution } from "./types";
export declare class AppService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns the bootstrap data; tab bar configuration, third-party SDK configs, and feature flags.
     */
    getBootstrapData(): Promise<BootstrapData>;
    /**
     * Returns a page by its page ID. The response shape is shared across all page routes.
     *
     * Known page IDs (no params required):
     * - `home_page_root`
     * - `purchases-page-root`
     * - `meals-page-root`
     * - `slot-selector-root`
     * - `category-tree-root`
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
    getPage(pageId: string): Promise<FusionPage>;
    /**
     * Resolves a Picnic deeplink URL to its target resource.
     * The app uses this to handle universal links and custom scheme URIs
     * (e.g. URLs like `https://picnic.app/nl/deeplink/...`).
     * @param {string} url The deeplink URL to resolve.
     */
    resolveDeeplink(url: string): Promise<DeeplinkResolution>;
}
//# sourceMappingURL=service.d.ts.map