import { ApiConfig, CountryCode } from "./types/common";
import { parseCheckoutIssueError } from "./errors/checkout-error";

/** A request body accepted by `fetch`, without `null`. */
export type RequestBody = NonNullable<RequestInit["body"]>;

/**
 * Base HTTP client that handles request construction, authentication headers,
 * and error handling for the Picnic API.
 */
export default class HttpClient {
  countryCode: CountryCode;
  apiVersion: string;
  authKey: string | null;
  url: string;
  deviceId: string;
  agent: string;

  constructor(options?: ApiConfig) {
    this.countryCode = options?.countryCode || "NL";
    this.apiVersion = options?.apiVersion || "15";
    this.authKey = options?.authKey || null;
    this.url = options?.url || `https://storefront-prod.${this.countryCode.toLowerCase()}.picnicinternational.com/api/${this.apiVersion}`;
    this.deviceId = options?.deviceId || "3C417201548B2E3B";
    this.agent = options?.agent || "30100;1.236.1-15553;";
  }

  get baseHeaders(): Record<string, string> {
    return {
      "User-Agent": "okhttp/4.9.0",
      "Content-Type": "application/json; charset=UTF-8",
      "Accept-Language": this.countryCode === "DE" ? "de" : (this.countryCode === "FR" ? "fr" : "nl"),
      ...(this.authKey && { "x-picnic-auth": this.authKey }),
    };
  }

  get picnicHeaders(): Record<string, string> {
    return {
      "x-picnic-agent": this.agent,
      "x-picnic-did": this.deviceId,
    };
  }

  /**
   * Can be used to send custom requests that are not covered by the domain services.
   * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
   * @param {string} path The path, optionally including query params. Example: `/cart/set_delivery_slot` or `/my_store?depth=0`.
   * @param {TRequestData|null} [data=null] The request body, typically for POST or PUT requests.
   * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
   * @param {boolean} [isImageRequest=false] When true, returns an ArrayBuffer instead of JSON.
   */
  sendRequest<TRequestData, TResponseData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null = null,
    includePicnicHeaders: boolean = false,
    isImageRequest: boolean = false,
  ): Promise<TResponseData> {
    const headers = new Headers({
      ...this.baseHeaders,
      ...(includePicnicHeaders && this.picnicHeaders),
    });

    return this.performRequest<TResponseData>(method, path, headers, data ? JSON.stringify(data) : null, isImageRequest);
  }

  /**
   * Sends a request with a raw (non-JSON) body, such as image bytes.
   * Uses the same authentication headers and error handling as {@link sendRequest},
   * but sets `Content-Type` to `contentType` instead of the JSON default.
   * @param {string} method The HTTP method to use: POST or PUT.
   * @param {string} path The path, optionally including query params.
   * @param {RequestBody} body The raw request body.
   * @param {string} contentType The MIME type of the body, e.g. `image/jpeg`.
   * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
   */
  sendRawRequest<TResponseData>(
    method: "POST" | "PUT",
    path: string,
    body: RequestBody,
    contentType: string,
    includePicnicHeaders: boolean = false,
  ): Promise<TResponseData> {
    const headers = new Headers({
      ...this.baseHeaders,
      ...(includePicnicHeaders && this.picnicHeaders),
      "Content-Type": contentType,
    });

    return this.performRequest<TResponseData>(method, path, headers, body, false);
  }

  /**
   * Low-level request used by {@link sendRequest} and {@link sendRawRequest}: resolves
   * the URL, sends the request and turns error responses into exceptions. Prefer those
   * two methods; this one exists so both share the same handling.
   */
  async performRequest<TResponseData>(
    method: string,
    path: string,
    headers: Headers,
    body: RequestBody | null,
    isImageRequest: boolean,
  ): Promise<TResponseData> {
    // `path` may be an absolute URL (e.g. image requests target a different base
    // than the API), in which case it must be used as-is rather than prefixed.
    const requestUrl = /^https?:\/\//.test(path) ? path : `${this.url}${path}`;

    const response = await fetch(requestUrl, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const responseBody = await response.text();

      try {
        const errorData: unknown = JSON.parse(responseBody);
        const checkoutIssue = parseCheckoutIssueError(errorData);
        if (checkoutIssue) throw checkoutIssue;

        const parsed = errorData as { error?: { message?: string } };
        throw new Error(`${parsed.error?.message || response.statusText}`);
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
        throw new Error(`${response.status} ${response.statusText}${responseBody ? ` - ${responseBody}` : ""}`);
      }
    }

    if (isImageRequest) {
      return response.arrayBuffer() as Promise<TResponseData>;
    }

    if (response.body !== null) {
      return response.json() as Promise<TResponseData>;
    }

    return undefined as TResponseData;
  }
}
