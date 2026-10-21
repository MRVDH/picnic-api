import type { PicnicErrorBody } from "./checkout-error";

/**
 * Thrown when Picnic answers a request with an error status. Tell errors apart by `status` and
 * Picnic's own error `code`, not by the message: a wrong password is a 401 with code
 * `AUTH_INVALID_CRED`, a wrong 2FA code a 400 with code `OTP_NOT_VALID`. The edge in front of the
 * API answers with an HTML page instead of JSON (e.g. a 403 when it throttles the client); those
 * have no `code`.
 */
export class PicnicApiError extends Error {
  /** The HTTP status, e.g. 401. */
  readonly status: number;
  /** Picnic's error code from the JSON body, e.g. `AUTH_INVALID_CRED`, or null when the body has none. */
  readonly code: string | null;
  /** The response body as text. */
  readonly body: string;

  constructor(status: number, statusText: string, body: string) {
    const json = parseErrorBody(body);
    const code = json?.error?.code ?? json?.code ?? null;
    const message = json?.error?.message ?? json?.message;
    const statusLine = `${status} ${statusText}`.trim();
    super(json ? message || statusLine : `${statusLine}${body ? ` - ${body}` : ""}`);
    this.name = "PicnicApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/** Reads a JSON error body, or returns null for a body that isn't a JSON object. */
export function parseErrorBody(body: string): PicnicErrorBody | null {
  try {
    const value: unknown = JSON.parse(body);
    return value !== null && typeof value === "object" ? (value as PicnicErrorBody) : null;
  } catch {
    return null;
  }
}

export function isPicnicApiError(error: unknown): error is PicnicApiError {
  return error instanceof PicnicApiError;
}
