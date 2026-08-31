export type CheckoutIssueDetails = {
    type: string;
    localized_message: string;
    blocking: boolean;
    resolve_key: string;
    localized_title: string;
    localized_continue_button_text?: string;
    localized_cancel_button_text?: string;
};
export type PicnicErrorBody = {
    code?: string;
    message?: string;
    details?: CheckoutIssueDetails;
    error?: {
        code?: string;
        message?: string;
        details?: CheckoutIssueDetails;
    };
};
/**
 * Structured checkout issue returned when the cart cannot proceed (e.g. alcohol age check).
 * Mirrors simonmartyr/picnic-api CheckoutError / PicnicErrorDetails.
 */
export declare class CheckoutIssueError extends Error {
    readonly code: string;
    readonly title: string;
    readonly issueMessage: string;
    readonly resolveKey: string;
    readonly blocking: boolean;
    readonly issueType: string;
    constructor(details: {
        code: string;
        title: string;
        issueMessage: string;
        resolveKey: string;
        blocking: boolean;
        issueType: string;
    });
    isAgeVerificationIssue(): boolean;
}
export declare function parseCheckoutIssueError(body: unknown): CheckoutIssueError | null;
export declare function isCheckoutIssueError(error: unknown): error is CheckoutIssueError;
//# sourceMappingURL=checkout-error.d.ts.map