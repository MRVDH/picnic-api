import { CheckoutIssueError, parseCheckoutIssueError } from "./checkout-error";

describe("parseCheckoutIssueError", () => {
  it("returns null for non-cart errors", () => {
    expect(parseCheckoutIssueError({ code: "OTHER" })).toBeNull();
    expect(parseCheckoutIssueError(null)).toBeNull();
  });

  it("parses age verification issue from nested error body", () => {
    const issue = parseCheckoutIssueError({
      code: "CART_HAS_ISSUES",
      message: "Cart has issues",
      details: {
        type: "LEGACY_ALCOHOL_AGE_VERIFICATION_REQUIRED",
        localized_title: "Altersprüfung",
        localized_message: "Du musst 18+ sein",
        resolve_key: "age_verified",
        blocking: false,
      },
    });

    expect(issue).toBeInstanceOf(CheckoutIssueError);
    expect(issue?.isAgeVerificationIssue()).toBe(true);
    expect(issue?.resolveKey).toBe("age_verified");
    expect(issue?.blocking).toBe(false);
    expect(issue?.title).toBe("Altersprüfung");
  });

  it("parses blocking minimum-order style issue", () => {
    const issue = parseCheckoutIssueError({
      error: {
        code: "CART_HAS_ISSUES",
        message: "Minimum not reached",
        details: {
          type: "MINIMUM_ORDER_VALUE_NOT_REACHED",
          localized_title: "Mindestbestellwert",
          localized_message: "Noch 5 Euro fehlen",
          resolve_key: "",
          blocking: true,
        },
      },
    });

    expect(issue?.blocking).toBe(true);
    expect(issue?.issueType).toBe("MINIMUM_ORDER_VALUE_NOT_REACHED");
    expect(issue?.isAgeVerificationIssue()).toBe(false);
  });
});
