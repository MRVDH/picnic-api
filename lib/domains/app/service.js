"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const page_format_error_1 = require("../../errors/page-format-error");
const rsc_1 = require("./rsc");
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
    async getPage(pageId) {
        const page = await this.http.sendRequest("GET", `/pages/${pageId}`, null, true);
        if (typeof page === "string")
            throw new page_format_error_1.UnexpectedPageFormatError(pageId, "rsc");
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
    async getRscPage(pageId) {
        const page = await this.http.sendRequest("GET", `/pages/${pageId}`, null, true);
        if (typeof page !== "string")
            throw new page_format_error_1.UnexpectedPageFormatError(pageId, "fusion");
        return (0, rsc_1.parseRscPayload)(page);
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