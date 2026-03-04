"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
class AppService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns the bootstrap data; tab bar configuration, third-party SDK configs, and feature flags.
     */
    getBootstrapData() {
        return this.http.sendRequest("GET", `/bootstrap`);
    }
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
    getPage(pageId) {
        return this.http.sendRequest("GET", `/pages/${pageId}`, null, true);
    }
    /**
     * Resolves a Picnic deeplink URL to its target resource.
     * The app uses this to handle universal links and custom scheme URIs
     * (e.g. URLs like `https://picnic.app/nl/deeplink/...`).
     * @param {string} url The deeplink URL to resolve.
     */
    resolveDeeplink(url) {
        return this.http.sendRequest("POST", `/deeplink/resolve`, { url }, true);
    }
}
exports.AppService = AppService;
//# sourceMappingURL=service.js.map