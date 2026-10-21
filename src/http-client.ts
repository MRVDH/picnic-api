import { ApiConfig, CountryCode } from "./types/common";
import { PicnicApiError, parseErrorBody } from "./errors/api-error";
import { parseCheckoutIssueError } from "./errors/checkout-error";

/** Options for {@link HttpClient.sendRequest} and {@link HttpClient.sendRequestWithHeaders}. */
export type RequestOptions = {
  /** Whether to include the x-picnic-agent and x-picnic-did headers. Default: false. */
  includePicnicHeaders?: boolean;
  /** Headers to add to the request. */
  headers?: Record<string, string>;
  /**
   * Whether to send the auth key. Default: only for requests to the API's own origin, so an
   * absolute URL to another host (a payment redirect, a CDN file) never gets the user's key unless
   * this is `true`. Set `false` for public routes.
   */
  authenticated?: boolean;
  /** Whether to return the body as an ArrayBuffer instead of parsing it. Default: false. */
  binary?: boolean;
  /** The MIME type of a raw (non-JSON) body, e.g. `image/jpeg`. Default: `application/octet-stream`. */
  contentType?: string;
};

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
    this.agent = options?.agent || "30100;1.251.0-15611;";
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
   * Sends a request to the Picnic API; the domain services use it, and it can be used for
   * requests they don't cover.
   *
   * Objects passed as `data` are sent as JSON. A `Blob`, `ArrayBuffer` or typed array
   * (e.g. `Uint8Array`) is sent as-is, with `Content-Type` set to `options.contentType`.
   * Responses served as a React Server Components payload (`text/x-component`) are returned as
   * the raw text instead of being parsed as JSON. An error status throws a `PicnicApiError` with
   * the status and Picnic's error code, or a `CheckoutIssueError` when the cart can't be checked out.
   * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
   * @param {string} path The path, optionally including query params, e.g. `/cart/set_delivery_slot`, or an absolute URL.
   * @param {TRequestData|null} [data=null] The request body, typically for POST or PUT requests.
   * @param {RequestOptions} [options] Picnic headers, extra headers, authentication, the body's content type and the response type.
   */
  async sendRequest<TRequestData, TResponseData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null = null,
    options: RequestOptions = {},
  ): Promise<TResponseData> {
    return (await this.sendRequestWithHeaders<TRequestData, TResponseData>(method, path, data, options)).data;
  }

  /**
   * Like {@link sendRequest}, but also returns the response headers. Used for routes where the
   * app reads headers, such as `x-picnic-auth` after a login and `X-Page-Version` for RSC pages.
   * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
   * @param {string} path The path, optionally including query params, or an absolute URL.
   * @param {TRequestData|null} [data=null] The request body.
   * @param {RequestOptions} [options] Picnic headers, extra headers, authentication, the body's content type and the response type.
   */
  async sendRequestWithHeaders<TRequestData, TResponseData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null = null,
    options: RequestOptions = {},
  ): Promise<{ data: TResponseData; headers: Headers }> {
    if (typeof options === "boolean") {
      throw new TypeError("The fourth argument of sendRequest is an options object, e.g. { includePicnicHeaders: true }.");
    }
    const response = await this.fetchResponse(method, path, data, options);
    return { data: await this.readResponseBody<TResponseData>(response, options.binary ?? false), headers: response.headers };
  }

  /** Sends the request and throws for non-2xx responses; the body is left unread. */
  private async fetchResponse<TRequestData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null,
    options: RequestOptions,
  ): Promise<Response> {
    const isRawBody = data instanceof Blob || data instanceof ArrayBuffer || ArrayBuffer.isView(data);

    // `path` may be an absolute URL (e.g. product images are served outside the API path), in
    // which case it is used as-is rather than prefixed.
    const requestUrl = /^https?:\/\//.test(path) ? path : `${this.url}${path}`;
    const sendAuthKey = options.authenticated ?? new URL(requestUrl).origin === new URL(this.url).origin;
    const { "x-picnic-auth": authKey, ...baseHeaders } = this.baseHeaders;

    const headers = new Headers({
      ...baseHeaders,
      ...(sendAuthKey && authKey && { "x-picnic-auth": authKey }),
      ...(options.includePicnicHeaders && this.picnicHeaders),
      ...(isRawBody && { "Content-Type": options.contentType ?? "application/octet-stream" }),
      ...options.headers,
    });

    const body: RequestInit["body"] = data === null ? null : isRawBody ? (data as unknown as NonNullable<RequestInit["body"]>) : JSON.stringify(data);

    const response = await fetch(requestUrl, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      const checkoutIssue = parseCheckoutIssueError(parseErrorBody(responseBody));
      if (checkoutIssue) throw checkoutIssue;
      throw new PicnicApiError(response.status, response.statusText, responseBody);
    }

    return response;
  }

  /** Reads the body as an ArrayBuffer (image and other binary requests), RSC text or JSON. */
  private async readResponseBody<TResponseData>(response: Response, binary: boolean): Promise<TResponseData> {
    if (binary) {
      return response.arrayBuffer() as Promise<TResponseData>;
    }

    if (response.headers?.get("content-type")?.includes("text/x-component")) {
      return response.text() as Promise<TResponseData>;
    }

    if (response.body !== null) {
      return response.json() as Promise<TResponseData>;
    }

    return undefined as TResponseData;
  }
}
