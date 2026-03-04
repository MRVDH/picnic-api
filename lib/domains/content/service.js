"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
class ContentService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns the FAQ content page in PML (Picnic Markup Language) format.
     * Used to populate the in-app FAQ / help section.
     */
    getFaqContent() {
        return this.http.sendRequest("GET", `/content/faq`, null, true);
    }
    /**
     * Returns the content shown on the search empty-state screen (no results).
     * Returned in PML (Picnic Markup Language) format.
     */
    getSearchEmptyState() {
        return this.http.sendRequest("GET", `/content/search_empty_state`, null, true);
    }
}
exports.ContentService = ContentService;
//# sourceMappingURL=service.js.map