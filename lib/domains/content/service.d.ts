import type HttpClient from "../../http-client";
import { PML, Component } from "../../types/fusion";
export declare class ContentService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns the FAQ content page in PML (Picnic Markup Language) format.
     * Used to populate the in-app FAQ / help section.
     */
    getFaqContent(): Promise<PML<Component>>;
    /**
     * Returns the content shown on the search empty-state screen (no results).
     * Returned in PML (Picnic Markup Language) format.
     */
    getSearchEmptyState(): Promise<PML<Component>>;
}
//# sourceMappingURL=service.d.ts.map