"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutIssueError = void 0;
exports.parseCheckoutIssueError = parseCheckoutIssueError;
exports.isCheckoutIssueError = isCheckoutIssueError;
const AGE_VERIFICATION_TYPE = "LEGACY_ALCOHOL_AGE_VERIFICATION_REQUIRED";
/**
 * Structured checkout issue returned when the cart cannot proceed (e.g. alcohol age check).
 * Mirrors simonmartyr/picnic-api CheckoutError / PicnicErrorDetails.
 */
class CheckoutIssueError extends Error {
    constructor(details) {
        super(details.issueMessage || details.title || details.code);
        this.name = "CheckoutIssueError";
        this.code = details.code;
        this.title = details.title;
        this.issueMessage = details.issueMessage;
        this.resolveKey = details.resolveKey;
        this.blocking = details.blocking;
        this.issueType = details.issueType;
    }
    isAgeVerificationIssue() {
        return this.issueType === AGE_VERIFICATION_TYPE;
    }
}
exports.CheckoutIssueError = CheckoutIssueError;
function parseCheckoutIssueError(body) {
    if (!body || typeof body !== "object")
        return null;
    const raw = body;
    const code = raw.code ?? raw.error?.code;
    if (code !== "CART_HAS_ISSUES")
        return null;
    const details = raw.details ?? raw.error?.details;
    if (!details || typeof details !== "object") {
        return new CheckoutIssueError({
            code: "CART_HAS_ISSUES",
            title: raw.message ?? raw.error?.message ?? "Cart has issues",
            issueMessage: raw.message ?? raw.error?.message ?? "Cart has issues",
            resolveKey: "",
            blocking: true,
            issueType: "UNKNOWN",
        });
    }
    return new CheckoutIssueError({
        code: "CART_HAS_ISSUES",
        title: details.localized_title || "Cart has issues",
        issueMessage: details.localized_message || raw.message || raw.error?.message || "Cart has issues",
        resolveKey: details.resolve_key || "",
        blocking: details.blocking ?? true,
        issueType: details.type || "UNKNOWN",
    });
}
function isCheckoutIssueError(error) {
    return error instanceof CheckoutIssueError;
}
//# sourceMappingURL=checkout-error.js.map