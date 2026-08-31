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

const AGE_VERIFICATION_TYPE = "LEGACY_ALCOHOL_AGE_VERIFICATION_REQUIRED";

/**
 * Structured checkout issue returned when the cart cannot proceed (e.g. alcohol age check).
 * Mirrors simonmartyr/picnic-api CheckoutError / PicnicErrorDetails.
 */
export class CheckoutIssueError extends Error {
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
  }) {
    super(details.issueMessage || details.title || details.code);
    this.name = "CheckoutIssueError";
    this.code = details.code;
    this.title = details.title;
    this.issueMessage = details.issueMessage;
    this.resolveKey = details.resolveKey;
    this.blocking = details.blocking;
    this.issueType = details.issueType;
  }

  isAgeVerificationIssue(): boolean {
    return this.issueType === AGE_VERIFICATION_TYPE;
  }
}

export function parseCheckoutIssueError(body: unknown): CheckoutIssueError | null {
  if (!body || typeof body !== "object") return null;

  const raw = body as PicnicErrorBody;
  const code = raw.code ?? raw.error?.code;
  if (code !== "CART_HAS_ISSUES") return null;

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

export function isCheckoutIssueError(error: unknown): error is CheckoutIssueError {
  return error instanceof CheckoutIssueError;
}
