import type { PageFormat } from "../pages/types";

/**
 * Thrown when a method that reads a page gets the page in another format than it parses: Picnic
 * served an RSC payload where the method reads a Fusion page, or the other way around. Which format
 * Picnic serves depends on the page and the `x-picnic-agent` version, and Picnic is moving pages
 * from Fusion to RSC. `app.getPage` returns a page in either format.
 */
export class UnexpectedPageFormatError extends Error {
  readonly pageId: string;
  readonly receivedFormat: PageFormat;

  constructor(pageId: string, receivedFormat: PageFormat) {
    super(`Page "${pageId}" was served as ${receivedFormat === "rsc" ? "an RSC payload instead of a Fusion page" : "a Fusion page instead of an RSC payload"}.`);
    this.name = "UnexpectedPageFormatError";
    this.pageId = pageId;
    this.receivedFormat = receivedFormat;
  }
}

export function isUnexpectedPageFormatError(error: unknown): error is UnexpectedPageFormatError {
  return error instanceof UnexpectedPageFormatError;
}
