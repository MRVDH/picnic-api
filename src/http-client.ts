import { ApiConfig, CountryCode } from "./types/common";
import { parseCheckoutIssueError } from "./errors/checkout-error";

/**
 * Base HTTP client that handles request construction, authentication headers,
 * and error handling for the Picnic API.
 */
/** Options for {@link HttpClient.sendRequestWithHeaders}. */
export type RequestOptions = {
  /** Whether to include the x-picnic-agent and x-picnic-did headers. Default: false. */
  includePicnicHeaders?: boolean;
  /** Headers to add to the request. */
  headers?: Record<string, string>;
  /** Whether to send the auth key. Default: true; set false for static files such as RSC client chunks. */
  authenticated?: boolean;
  /** Whether to return the body as an ArrayBuffer instead of parsing it. Default: false. */
  binary?: boolean;
};

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
   * Can be used to send custom requests that are not covered by the domain services.
   *
   * Objects passed as `data` are sent as JSON. A `Blob`, `ArrayBuffer` or typed array
   * (e.g. `Uint8Array`) is sent as-is, with `Content-Type` set to `contentType`.
   * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
   * @param {string} path The path, optionally including query params. Example: `/cart/set_delivery_slot` or `/my_store?depth=0`.
   * @param {TRequestData|null} [data=null] The request body, typically for POST or PUT requests.
   * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
   * @param {boolean} [isImageRequest=false] When true, returns an ArrayBuffer instead of JSON.
   *
   * Responses served as a React Server Components payload (`text/x-component`) are
   * returned as the raw text instead of being parsed as JSON.
   * @param {string} [contentType="application/octet-stream"] The MIME type of a raw (non-JSON) `data` body, e.g. `image/jpeg`.
   */
  async sendRequest<TRequestData, TResponseData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null = null,
    includePicnicHeaders: boolean = false,
    isImageRequest: boolean = false,
    contentType?: string,
  ): Promise<TResponseData> {
    const response = await this.fetchResponse(method, path, data, includePicnicHeaders, contentType);
    return this.readResponseBody<TResponseData>(response, isImageRequest);
  }

  /**
   * Like {@link sendRequest}, but takes its options as an object and also returns the response
   * headers. Used for routes where the app reads or sends extra headers, such as `X-Page-Version`
   * for RSC pages, and for requests that must not carry the auth header.
   * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
   * @param {string} path The path, optionally including query params, or an absolute URL.
   * @param {TRequestData|null} [data=null] The request body, sent as JSON.
   * @param {RequestOptions} [options] Extra headers, Picnic headers, authentication and response type.
   */
  async sendRequestWithHeaders<TRequestData, TResponseData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null = null,
    options: RequestOptions = {},
  ): Promise<{ data: TResponseData; headers: Headers }> {
    const response = await this.fetchResponse(method, path, data, options.includePicnicHeaders ?? false, undefined, options.headers, options.authenticated ?? true);
    return { data: await this.readResponseBody<TResponseData>(response, options.binary ?? false), headers: response.headers };
  }

  /** Sends the request and throws for non-2xx responses; the body is left unread. */
  private async fetchResponse<TRequestData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null,
    includePicnicHeaders: boolean,
    contentType?: string,
    extraHeaders: Record<string, string> = {},
    authenticated = true,
  ): Promise<Response> {
    const isRawBody = data instanceof Blob || data instanceof ArrayBuffer || ArrayBuffer.isView(data);

    const headers = new Headers({
      ...this.baseHeaders,
      ...(includePicnicHeaders && this.picnicHeaders),
      ...(isRawBody && { "Content-Type": contentType ?? "application/octet-stream" }),
      ...extraHeaders,
    });
    if (!authenticated) headers.delete("x-picnic-auth");

    const body: RequestInit["body"] = data === null ? null : isRawBody ? (data as unknown as NonNullable<RequestInit["body"]>) : JSON.stringify(data);

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

    return response;
  }

  /** Reads the body as an ArrayBuffer (image and other binary requests), RSC text or JSON. */
  private async readResponseBody<TResponseData>(response: Response, isImageRequest: boolean): Promise<TResponseData> {
    if (isImageRequest) {
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
