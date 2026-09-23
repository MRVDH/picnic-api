import type { PageFormat } from "../types/rsc";
/**
 * Thrown when a page is served in a different format than the method expects:
 * `app.getPage` got an RSC payload, or `app.getRscPage` got a Fusion page.
 * Which format Picnic serves depends on the page and the `x-picnic-agent`
 * version, so use the method that matches `receivedFormat`.
 */
export declare class UnexpectedPageFormatError extends Error {
    readonly pageId: string;
    readonly receivedFormat: PageFormat;
    constructor(pageId: string, receivedFormat: PageFormat);
}
export declare function isUnexpectedPageFormatError(error: unknown): error is UnexpectedPageFormatError;
//# sourceMappingURL=page-format-error.d.ts.map