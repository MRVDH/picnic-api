"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedPageFormatError = void 0;
exports.isUnexpectedPageFormatError = isUnexpectedPageFormatError;
/**
 * Thrown when a page is served in a different format than the method expects:
 * `app.getPage` got an RSC payload, or `app.getRscPage` got a Fusion page.
 * Which format Picnic serves depends on the page and the `x-picnic-agent`
 * version, so use the method that matches `receivedFormat`.
 */
class UnexpectedPageFormatError extends Error {
    constructor(pageId, receivedFormat) {
        const method = receivedFormat === "rsc" ? "app.getRscPage" : "app.getPage";
        super(`Page "${pageId}" was served as ${receivedFormat === "rsc" ? "an RSC payload" : "a Fusion page"}; use ${method} to fetch it.`);
        this.name = "UnexpectedPageFormatError";
        this.pageId = pageId;
        this.receivedFormat = receivedFormat;
    }
}
exports.UnexpectedPageFormatError = UnexpectedPageFormatError;
function isUnexpectedPageFormatError(error) {
    return error instanceof UnexpectedPageFormatError;
}
//# sourceMappingURL=page-format-error.js.map