import type { PageFormat } from "../types/rsc";

/**
 * Thrown when a page is served in a different format than the method expects:
 * `app.getPage` got an RSC payload, or `app.getRscPage` got a Fusion page.
 * Which format Picnic serves depends on the page and the `x-picnic-agent`
 * version, so use the method that matches `receivedFormat`.
 */
export class UnexpectedPageFormatError extends Error {
  readonly pageId: string;
  readonly receivedFormat: PageFormat;

  constructor(pageId: string, receivedFormat: PageFormat) {
    const method = receivedFormat === "rsc" ? "app.getRscPage" : "app.getPage";
    super(`Page "${pageId}" was served as ${receivedFormat === "rsc" ? "an RSC payload" : "a Fusion page"}; use ${method} to fetch it.`);
    this.name = "UnexpectedPageFormatError";
    this.pageId = pageId;
    this.receivedFormat = receivedFormat;
  }
}

export function isUnexpectedPageFormatError(error: unknown): error is UnexpectedPageFormatError {
  return error instanceof UnexpectedPageFormatError;
}
